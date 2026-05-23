# Backend Analysis
> Audit Date: 2026-05-23 | Read-only analysis. No changes made.

---

## Overview

The backend is a **FastAPI** application organized into two directories:
- `backend_api/` — The live API server (active, production code)
- `backend/` — Phase 1 legacy scripts + the shared database connection helper

---

## `backend_api/main.py` — App Factory

```python
app = FastAPI(title="Face Attendance System API")

app.include_router(auth_router)       # /auth
app.include_router(students_router)   # /students
app.include_router(attendance_router) # /attendance

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Issues:**
- CORS middleware registered AFTER routers — unconventional ordering (should be before, but FastAPI handles it correctly either way)
- Only `http://localhost:5173` is whitelisted — production deployment will be blocked
- No global exception handler
- No request logging
- No API versioning (e.g., `/api/v1/`)

---

## `backend_api/routers/auth.py`

**Prefix:** `/auth`

### Configuration
```python
SECRET_KEY = "supersecret"  # 🔴 HARDCODED
ALGORITHM = "HS256"
```

### Endpoints

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/auth/login` | POST | None | ✅ Working |
| `/auth/register` | POST | None | ⚠️ Broken (422 from frontend) |
| `/auth/me` | GET | Bearer | ⚠️ Broken (500 on invalid token) |

### `login()` Function
- Accepts `OAuth2PasswordRequestForm` (form data)
- Looks up student by `student_id` (used as username)
- Verifies bcrypt hash via `passlib`
- Issues 8-hour HS256 JWT: `{ sub: student_id, exp: now+8h }`
- **Status:** ✅ Correct implementation

### `register()` Function
- Declared as: `def register(student_id: str, name: str, department: str, password: str)`
- FastAPI maps plain parameters to **query params** not body
- Frontend sends JSON body → HTTP 422
- Stores student WITHOUT face embedding — useless for face attendance
- **Status:** ❌ Broken at integration level

### `me()` Function
- Extracts Bearer token via `oauth2_scheme`
- Calls `jwt.decode()` — **no try/except** — crashes on expired/invalid tokens
- **Status:** ⚠️ Broken (500 instead of 401)

---

## `backend_api/routers/students.py`

**Prefix:** `/students`

### ML Models — Loaded at Import Time
```python
device = "cuda" if torch.cuda.is_available() else "cpu"

mtcnn = MTCNN(image_size=160, margin=20, keep_all=True, device=device)
facenet = InceptionResnetV1(pretrained="vggface2").eval().to(device)
```

**Impact:** Loading these models on server startup adds 2-5 seconds to boot time. Any import failure (torch not installed, etc.) crashes the entire application before it starts.

### `POST /students/register`
1. Hash password (imports `pwd_context` from `auth.py`)
2. Read image bytes → PIL Image → `mtcnn(img)` → `faces[0].unsqueeze(0)`
3. `facenet(face)` → 512-dim embedding tensor
4. `pickle.dumps(embedding.cpu().numpy())` → stored as BLOB
5. Also writes clean `{ student_id, name, embedding: list }` to `students_cache.pkl`
6. Returns: `{ message, student_id }`

**Issue — Cache Dual-Format:**
- DB stores: `pickle.dumps(embedding.cpu().numpy())` → shape `(1, 512)` numpy array
- Cache stores: `emb_np.tolist()` where `emb_np = embedding.cpu().numpy()[0]` → flat 512-float list

The `get_student_embedding` endpoint does `pickle.loads(row[2])[0]` to extract the first row. This works because the DB stores a `(1, 512)` array and `[0]` gives `(512,)`.

### `GET /students/all`
- No auth required
- Returns: `[{ student_id, name, department }]`
- **Status:** ✅ Working

### `GET /students/{student_id}/embedding`
- No auth required — exposes raw face biometric data
- `pickle.loads(row[2])[0]` — crashes if `row[2]` is NULL (student registered without face)
- Returns: `{ student_id, name, embedding: [512 floats] }`
- **Status:** ✅ Working (unless NULL embedding exists)

---

## `backend_api/routers/attendance.py`

**Prefix:** `/attendance`

All endpoints are unprotected (no `Depends` on auth).

### `GET /attendance/today`
- Returns today's date, count of present students, and their IDs + times
- **Status:** ✅ Working

### `GET /attendance/history`
- Returns all records ordered `date DESC, time DESC`
- No pagination — full table scan
- **Status:** ✅ Working

### `GET /attendance/student/{student_id}/records`
- Returns this student's records ordered `date DESC`
- **Status:** ✅ Working

### `GET /attendance/student/{student_id}`
- Present count: `COUNT(*)` WHERE `student_id`
- Total classes: `COUNT(DISTINCT date)` from ENTIRE `attendance` table
- **Semantic issue:** Total classes is system-wide, not per-student
- **Status:** ✅ Working (with noted semantic quirk)

### `POST /attendance/mark`
- Body: `dict` — no Pydantic model validation
- Extracts `student_id = data.get("student_id")`
- Deduplicates by `(student_id, date)` pair
- **Status:** ✅ Working

---

## `backend/database.py` — Shared Connection Helper

```python
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'database', 'attendance.db')

def get_connection():
    return sqlite3.connect(DB_PATH)
```

- Uses absolute path resolution — works regardless of CWD
- **No connection pooling** — each call opens a new connection
- SQLite is single-writer — concurrent writes from multiple requests may cause locking
- All callers must manually call `conn.close()` — no context manager used
- **Status:** ✅ Functional for current scale

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE,
    name TEXT,
    department TEXT,
    password TEXT,
    embedding BLOB
);

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    date TEXT,
    time TEXT
);
```

**Observations:**
- `attendance.student_id` has NO foreign key to `students.student_id` — no referential integrity
- `attendance.date` is TEXT (ISO format `YYYY-MM-DD`) — queried with string comparison ✅
- `attendance.time` is TEXT (`HH:MM:SS`) — not used for deduplication
- `embedding` BLOB is nullable — students registered via `/auth/register` have NULL here
- No indexes on `attendance(student_id, date)` — the most frequently queried columns
- No `created_at` timestamp on either table
- Database file size: 49,152 bytes (49 KB) — small, likely has some test data

---

## Legacy Backend Scripts (`backend/`)

| File | Purpose | Status |
|------|---------|--------|
| `database.py` | Connection helper | ✅ Active (imported by routers) |
| `init_db.py` | One-time DB init | ✅ Run once during setup |
| `register_student.py` | CLI registration (Phase 1) | ⚠️ Legacy — no password field |
| `mark_attendance.py` | CLI webcam attendance (Phase 1) | ⚠️ Legacy — superseded |
| `test_attendance.py` | Test stub | ❌ Nearly empty |
| `test_env.py` | Test stub | ❌ Nearly empty |
| `test_register.py` | Minimal test | 🟡 Minimal |

`init_db.py` uses a bare import `from database import create_tables` which only works from inside `backend/`. The README says `python backend/init_db.py` but this import would fail from project root.

---

## Security Summary

| Issue | Risk |
|-------|------|
| `SECRET_KEY = "supersecret"` | 🔴 Critical |
| No route-level auth guards on most endpoints | 🟠 High |
| Raw face embeddings accessible via GET | 🟠 High |
| No input validation Pydantic models on `/attendance/mark` | 🟡 Medium |
| No rate limiting on `/auth/login` | 🟡 Medium |
| SQLite without WAL mode | 🟢 Low (fine for small scale) |
