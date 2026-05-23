# Current Bugs & Issues
> Audit Date: 2026-05-23 | Read-only analysis. No changes made.
> Severity: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Bug #1 — `/auth/register` Content-Type Mismatch
**Severity:** 🔴 Critical  
**File:** `frontend/src/pages/auth/Register.tsx` + `backend_api/routers/auth.py`  
**Status:** Active — Frontend Register page is completely broken

### Description
The `Register.tsx` frontend sends the registration data as a JSON request body:
```typescript
await api.post('/auth/register', {
    student_id: studentId,
    name: name,
    department: department,
    password: password,
})
```

But the backend `auth.py` endpoint is declared as:
```python
@router.post("/register")
def register(student_id: str, name: str, department: str, password: str):
```

In FastAPI, plain function parameters map to **query parameters**, not a JSON body. The endpoint expects:
```
POST /auth/register?student_id=CS001&name=Akif&department=CS&password=pass
```

**Result:** HTTP 422 Unprocessable Entity every time a user tries to register from the frontend.

---

## Bug #2 — `/auth/me` Crashes on Invalid/Expired Token
**Severity:** 🔴 Critical  
**File:** `backend_api/routers/auth.py` lines 77-80  
**Status:** Active

### Description
```python
@router.get("/me")
def me(token: str = Depends(oauth2_scheme)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return {"student_id": payload["sub"]}
```

`jwt.decode()` raises `jose.ExpiredSignatureError` if the token is expired, and `jose.JWTError` if it is invalid or tampered. Neither is caught. FastAPI propagates these as unhandled 500 Internal Server Errors.

**Impact:** The Student Dashboard, Student Attendance page, and Student Webcam page all call `getMe()` which hits `/auth/me`. After 8 hours (or with a bad token), these pages will crash silently instead of redirecting to login.

**Expected behavior:** Should return `HTTP 401 Unauthorized`.

---

## Bug #3 — Hardcoded JWT Secret Key
**Severity:** 🔴 Critical  
**File:** `backend_api/routers/auth.py` line 12  
**Status:** Active

### Description
```python
SECRET_KEY = "supersecret"
```

The JWT signing key is hardcoded in source code and committed to the repository. Anyone with access to the repo can forge valid JWTs.

---

## Bug #4 — No Role-Based Access Control
**Severity:** 🟠 High  
**File:** `frontend/src/routes/ProtectedRoute.tsx`, `frontend/src/app/routes.tsx`, `backend_api/routers/*`  
**Status:** Active

### Description
The JWT payload contains only `{ sub: student_id, exp: timestamp }`. No role is stored. The only client-side role distinction is:
```typescript
if (username === "admin") navigate("/admin")
else navigate("/student")
```

Any student can:
1. Log in
2. Manually type `/admin` in the browser URL
3. `ProtectedRoute` passes them through because a token exists
4. They land on the admin dashboard

Backend endpoints are also fully unprotected — no `Depends(get_current_user)` on any route.

---

## Bug #5 — Attendance Service Import Path Fragility
**Severity:** 🟠 High  
**File:** `attendance_service/main.py` lines 5-8  
**Status:** Active

### Description
```python
from config import FACE_THRESHOLD, FRAME_SKIP, CAMERA_INDEX
from face_recognizer import recognize_faces, load_students
from api_client import mark_attendance
from cache_builder import build_cache
from liveness import BlinkDetector
```

These are **bare imports** — they only work if the Python interpreter's working directory is `attendance_service/`. Running from the project root:
```bash
python attendance_service/main.py
# → ModuleNotFoundError: No module named 'config'
```

The correct way to run is:
```bash
cd attendance_service
python main.py
```

This is documented in `README.md` but is easy to get wrong and gives a cryptic error.

---

## Bug #6 — Webcam Camera Read Failure Kills Loop
**Severity:** 🟠 High  
**File:** `attendance_service/main.py` lines 43-46  
**Status:** Active

### Description
```python
ret, frame = cap.read()
if not ret:
    print("[ERROR] Camera read failed")
    break
```

A single `cap.read()` failure (which can occur from momentary USB disconnects, driver hiccups, or frame drops) causes the entire webcam loop to exit permanently. The service must be manually restarted.

There is no retry logic, no reconnection attempt, no error recovery.

---

## Bug #7 — `useAuth.ts` Hook is Empty
**Severity:** 🟡 Medium  
**File:** `frontend/src/hooks/useAuth.ts`  
**Status:** Active

### Description
The file `useAuth.ts` exists at 0 bytes — completely empty. As a result:
- No centralized auth state exists
- Components independently read `localStorage` directly
- No logout function exists anywhere in the frontend
- `providers.tsx` (also empty) suggests React Context-based auth was planned but never implemented

---

## Bug #8 — Token Key Inconsistency (`token` vs `access_token`)
**Severity:** 🟡 Medium  
**Files:** Multiple  
**Status:** Active (currently doesn't break things, but is fragile)

### Description

| Location | Key Used |
|----------|----------|
| `Login.tsx` | `localStorage.setItem("token", ...)` |
| `auth.service.ts → login()` | `localStorage.setItem("token", ...)` |
| `api.ts interceptor` | `localStorage.getItem("token")` |
| `StudentLayout.tsx` | `localStorage.getItem("token")` |
| `ProtectedRoute.tsx` | `localStorage.getItem("access_token") \|\| localStorage.getItem("token")` |

The `"access_token"` key in `ProtectedRoute` is never written anywhere. It's a dead fallback. The current flow works only because `"token"` is consistently used. However, this dual-key check suggests confusion from earlier iterations, and could cause bugs if a developer changes the key name in one place but not all.

---

## Bug #9 — Student Webcam Page is Unreachable
**Severity:** 🟡 Medium  
**File:** `frontend/src/pages/student/Webcam.tsx`, `frontend/src/app/routes.tsx`  
**Status:** Active

### Description
`Webcam.tsx` exists and is a valid React component, but it is **never imported or registered** in `app/routes.tsx`. The student layout only has two nav links: Dashboard and Attendance. There is no route for `/student/webcam`.

The file is dead code — it cannot be accessed by users.

---

## Bug #10 — `/auth/register` Registers Students Without Face Embeddings
**Severity:** 🟡 Medium  
**File:** `backend_api/routers/auth.py`  
**Status:** Active (by design, but dangerous)

### Description
`/auth/register` inserts a student into the `students` table with only `student_id`, `name`, `department`, and `password` — no `embedding` BLOB.

A student registered this way:
- Can log in ✅
- Will NOT appear with a face in the attendance service ❌
- Cannot have attendance marked by the webcam ❌
- Will appear in `/students/all` ✅
- Will crash `/students/{id}/embedding` with a pickle decode error on NULL ❌

---

## Bug #11 — `/students/{id}/embedding` Will Crash on NULL Embedding
**Severity:** 🟡 Medium  
**File:** `backend_api/routers/students.py` line 132  
**Status:** Active (triggered by Bug #10)

### Description
```python
embedding = pickle.loads(row[2])[0]
```

If a student was registered via `/auth/register` (no photo), `row[2]` (the embedding column) is `NULL`. `pickle.loads(None)` raises a `TypeError`. There is no null check. The cache builder calls this endpoint for every student — meaning one NULL-embedding student will crash the entire cache build.

---

## Bug #12 — `blinked` State Not Reset on Failed Recognition
**Severity:** 🟢 Low  
**File:** `attendance_service/main.py` lines 79-92  
**Status:** Active

### Description
`blink_detector.blinked` is only reset to `False` after a successful attendance mark:
```python
if eligible and cooldown_ok:
    if blinked:
        success = mark_attendance(sid)
        if success:
            blink_detector.blinked = False  ← only here
```

If the student blinks, is recognized, but `mark_attendance()` returns `False` (e.g., API error, already marked), `blinked` remains `True`. On the next qualifying frame, the system will attempt to mark attendance again without requiring a new blink — partially defeating the liveness check.

---

## Bug #13 — `attendance_service/requirements.txt` is Empty
**Severity:** 🟢 Low  
**File:** `attendance_service/requirements.txt`  
**Status:** Active

### Description
The `requirements.txt` inside `attendance_service/` is empty (0 bytes). Dependencies for this service (`opencv-python`, `mediapipe`, `scikit-learn`, `requests`, `facenet-pytorch`, `torch`) must be installed manually or inferred from the README. No `requirements.txt` exists at the project root either.

---

## Bug #14 — Admin Charts Disabled with React 19 Note
**Severity:** 🟢 Low  
**File:** `frontend/src/pages/admin/Dashboard.tsx` lines 71-76  
**Status:** Active (workaround in place)

### Description
```tsx
<div className="rounded-xl border border-gray-800 bg-amber-900/10 p-6">
    <p className="text-amber-400 text-sm italic">
        Note: Charts are temporarily disabled to ensure compatibility with React 19.
    </p>
</div>
```

The admin dashboard had chart visualization (likely Recharts) that was commented out due to React 19 compatibility concerns. The student dashboard still uses Recharts PieChart, suggesting the issue was specific to the admin charts implementation, not Recharts itself.

---

## Bug Summary Table

| # | Bug | Severity | File(s) |
|---|-----|----------|---------|
| 1 | `/auth/register` content-type mismatch | 🔴 Critical | `Register.tsx`, `auth.py` |
| 2 | `/auth/me` unhandled JWT exceptions | 🔴 Critical | `auth.py` |
| 3 | Hardcoded JWT secret key | 🔴 Critical | `auth.py` |
| 4 | No role-based access control | 🟠 High | All routers, routes |
| 5 | Attendance service bare import paths | 🟠 High | `attendance_service/main.py` |
| 6 | Webcam loop exits on first read error | 🟠 High | `attendance_service/main.py` |
| 7 | `useAuth.ts` is empty | 🟡 Medium | `hooks/useAuth.ts` |
| 8 | Token key naming inconsistency | 🟡 Medium | Multiple frontend files |
| 9 | Webcam page has no registered route | 🟡 Medium | `Webcam.tsx`, `routes.tsx` |
| 10 | `/auth/register` omits face embedding | 🟡 Medium | `auth.py` |
| 11 | NULL embedding crash in `/students/{id}/embedding` | 🟡 Medium | `students.py` |
| 12 | `blinked` not reset on failed mark | 🟢 Low | `attendance_service/main.py` |
| 13 | `requirements.txt` is empty | 🟢 Low | `attendance_service/requirements.txt` |
| 14 | Admin charts disabled (React 19) | 🟢 Low | `admin/Dashboard.tsx` |
