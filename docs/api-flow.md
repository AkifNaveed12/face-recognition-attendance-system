# API Flow Documentation
> Audit Date: 2026-05-23 | Read-only analysis. No changes made.

---

## Base URL

```
http://localhost:8000
```

CORS is configured to only allow: `http://localhost:5173`

---

## Router Registration Order (main.py)

```python
app.include_router(auth_router)        # prefix: /auth
app.include_router(students_router)    # prefix: /students
app.include_router(attendance_router)  # prefix: /attendance
```

> ⚠️ **Bug:** CORS middleware is added AFTER routers are included. In FastAPI this still works, but the ordering is unconventional and could cause issues in edge cases with framework upgrades.

---

## Authentication Endpoints (`/auth`)

### POST `/auth/login`
- **Auth required:** No
- **Content-Type:** `application/x-www-form-urlencoded` (OAuth2PasswordRequestForm)
- **Request fields:** `username`, `password`
- **Backend logic:**
  1. Query `students` table WHERE `student_id = username`
  2. Verify bcrypt hash via `passlib`
  3. Issue JWT (HS256, 8-hour expiry, payload: `{ sub: student_id }`)
- **Response (200):**
  ```json
  { "access_token": "<JWT>", "token_type": "bearer" }
  ```
- **Response (401):** `"Invalid credentials"`
- **Status:** ✅ Working

---

### POST `/auth/register`
- **Auth required:** No
- **Content-Type:** Backend expects **query parameters** (function signature: `student_id: str, name: str, department: str, password: str`)
- **Frontend sends:** JSON body → `{ student_id, name, department, password }`
- **Backend logic:**
  1. Check if `student_id` already exists
  2. Hash password with bcrypt
  3. INSERT into `students` (no `embedding` stored here)
- **Response (200):** `{ "message": "User registered successfully" }`
- **Response (400):** `"Student ID already registered"`
- **Status:** ⚠️ **BROKEN** — Frontend sends JSON, backend expects query params. Results in HTTP 422 Unprocessable Entity.
- **Note:** This route registers a student WITHOUT a face embedding. The student cannot be recognized by the webcam service. The proper registration endpoint is `/students/register`.

---

### GET `/auth/me`
- **Auth required:** Yes (Bearer token via `oauth2_scheme`)
- **Backend logic:**
  1. Extract token from Authorization header
  2. `jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])`
  3. Return `{ "student_id": payload["sub"] }`
- **Response (200):** `{ "student_id": "CS001" }`
- **Status:** ⚠️ **BROKEN** — No `try/except`. An expired or tampered token raises `jose.ExpiredSignatureError` or `jose.JWTError` as an unhandled 500. Should return 401.
- **Used by:** `auth.service.ts → getMe()` which is called by Student Dashboard, Student Attendance, and Student Webcam pages.

---

## Student Endpoints (`/students`)

### POST `/students/register`
- **Auth required:** No (missing — should require admin auth)
- **Content-Type:** `multipart/form-data`
- **Request fields:** `student_id`, `name`, `department`, `password`, `image` (file)
- **Backend logic:**
  1. Hash password (imports `pwd_context` from `auth.py`)
  2. Load image bytes → PIL Image → MTCNN face detection
  3. Take `faces[0]`, run through FaceNet → 512-dim embedding
  4. INSERT into `students` (with `embedding` BLOB = `pickle.dumps(embedding.cpu().numpy())`)
  5. Append to `attendance_service/students_cache.pkl`
- **Response (200):** `{ "message": "Student registered successfully", "student_id": "CS001" }`
- **Response (400):** `"No face detected"`
- **Response (500):** Any other failure
- **Status:** ✅ Working
- **Note:** MTCNN and FaceNet are loaded at **module import time** — startup cost but fast at request time.

---

### GET `/students/all`
- **Auth required:** No (missing — exposes student PII)
- **Response (200):**
  ```json
  [
    { "student_id": "CS001", "name": "Akif", "department": "CS" },
    ...
  ]
  ```
- **Status:** ✅ Working
- **Used by:** Admin Dashboard, Admin Students page, Cache Builder

---

### GET `/students/{student_id}/embedding`
- **Auth required:** No (missing — exposes raw face embeddings)
- **Backend logic:**
  1. Query `students` WHERE `student_id = ?`
  2. `pickle.loads(row[2])[0]` → numpy array → `.tolist()`
- **Response (200):** `{ "student_id": "...", "name": "...", "embedding": [512 floats] }`
- **Response (404):** `"Student not found"`
- **Status:** ✅ Working
- **Used by:** `cache_builder.py` in the attendance service

---

## Attendance Endpoints (`/attendance`)

### POST `/attendance/mark`
- **Auth required:** No (missing — critical endpoint unprotected)
- **Content-Type:** `application/json`
- **Request body:** `{ "student_id": "CS001" }`
- **Backend logic:**
  1. Get current date and time
  2. Check if already marked today (SELECT 1 WHERE student_id AND date)
  3. If not marked → INSERT into `attendance`
- **Response — new mark:**
  ```json
  { "status": "marked", "student_id": "CS001", "date": "2026-05-23", "time": "09:14:22" }
  ```
- **Response — duplicate:**
  ```json
  { "status": "already_marked", "student_id": "CS001", "date": "2026-05-23" }
  ```
- **Status:** ✅ Working
- **Used by:** `attendance_service/api_client.py`, Student Webcam page (manual button)

---

### GET `/attendance/today`
- **Auth required:** No
- **Response (200):**
  ```json
  {
    "date": "2026-05-23",
    "total_present": 3,
    "records": [
      { "student_id": "CS001", "time": "09:14:22" },
      ...
    ]
  }
  ```
- **Status:** ✅ Working
- **Used by:** Admin Dashboard (10s poll), Admin Attendance page (5s poll)

---

### GET `/attendance/history`
- **Auth required:** No
- **Response (200):**
  ```json
  [
    { "student_id": "CS001", "date": "2026-05-23", "time": "09:14:22" },
    ...
  ]
  ```
- **Ordering:** `date DESC, time DESC`
- **Status:** ✅ Working
- **Used by:** Admin Reports page

---

### GET `/attendance/student/{student_id}`
- **Auth required:** No
- **Backend logic:**
  1. `COUNT(*)` WHERE `student_id`  → `present_count`
  2. `COUNT(DISTINCT date)` across ALL attendance → `total_classes`
  3. Computes percentage
- **Response (200):**
  ```json
  {
    "student_id": "CS001",
    "present": 5,
    "total_classes": 8,
    "attendance_percentage": 62.5
  }
  ```
- **Status:** ✅ Working
- **Note:** `total_classes` is the count of ALL DISTINCT dates across the ENTIRE attendance table, not just this student's classes. This is a semantic design decision that may skew percentages.
- **Used by:** Student Dashboard

---

### GET `/attendance/student/{student_id}/records`
- **Auth required:** No
- **Response (200):**
  ```json
  [
    { "date": "2026-05-23", "time": "09:14:22" },
    ...
  ]
  ```
- **Ordering:** `date DESC`
- **Status:** ✅ Working
- **Used by:** Student Attendance page

---

## Root Endpoint

### GET `/`
- **Response:** `{ "status": "API running" }`
- **Status:** ✅ Working — useful for health checks

---

## Complete Endpoint Map

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/` | None | ✅ |
| POST | `/auth/login` | None | ✅ |
| POST | `/auth/register` | None | ⚠️ Broken (422 from frontend) |
| GET | `/auth/me` | Bearer | ⚠️ Broken (500 on bad token) |
| POST | `/students/register` | None (missing) | ✅ |
| GET | `/students/all` | None (missing) | ✅ |
| GET | `/students/{id}/embedding` | None (missing) | ✅ |
| POST | `/attendance/mark` | None (missing) | ✅ |
| GET | `/attendance/today` | None (missing) | ✅ |
| GET | `/attendance/history` | None (missing) | ✅ |
| GET | `/attendance/student/{id}` | None (missing) | ✅ |
| GET | `/attendance/student/{id}/records` | None (missing) | ✅ |

> **Summary:** 10 out of 12 endpoints are unprotected. Only `/auth/me` requires a token. This means the entire data layer is effectively public to anyone who knows the API URL.
