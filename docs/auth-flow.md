# Auth Flow Documentation
> Audit Date: 2026-05-23 | Read-only analysis. No changes made.

---

## Overview

The system uses **JWT (JSON Web Token)** authentication via FastAPI's built-in `OAuth2PasswordBearer`. The token is stored in the browser's `localStorage`. There is no refresh token mechanism. There is no role-based access control.

---

## JWT Configuration

| Parameter | Value | Risk |
|-----------|-------|------|
| Secret Key | `"supersecret"` (hardcoded in `auth.py`) | 🔴 CRITICAL — exposed in source code |
| Algorithm | `HS256` | ✅ Standard |
| Expiry | 8 hours | ✅ Reasonable |
| Payload fields | `sub` (student_id), `exp` | ⚠️ No `role` field |

---

## Login Flow (Step-by-Step)

```
Browser (Login.tsx)
    │
    │  1. User fills username + password
    │  2. handleLogin() fires
    │  3. Builds URLSearchParams body:
    │     username=CS001&password=pass123
    │
    ▼
POST http://localhost:8000/auth/login
Content-Type: application/x-www-form-urlencoded
    │
    │  FastAPI: auth.py → login()
    │  4. Read form_data.username, form_data.password
    │  5. SELECT password FROM students WHERE student_id = 'CS001'
    │  6. verify_password(plain, hashed) via bcrypt
    │  7. create_token(student_id):
    │     payload = { "sub": "CS001", "exp": now + 8h }
    │     jwt.encode(payload, "supersecret", "HS256")
    │
    ▼
Response: { "access_token": "<JWT>", "token_type": "bearer" }
    │
    │  Back in Login.tsx:
    │  8. localStorage.setItem("token", res.data.access_token)
    │  9. Role routing decision:
    │     if (username === "admin") → navigate("/admin")
    │     else → navigate("/student")
    │
    ▼
User lands on /admin or /student
```

---

## Protected Route Flow

```
User navigates to /admin or /student
    │
    ▼
ProtectedRoute.tsx
    │
    │  token = localStorage.getItem("access_token")
    │         || localStorage.getItem("token")
    │
    │  if (!token) → <Navigate to="/login" />
    │  if (token)  → render children
    │
    ▼
AdminLayout.tsx or StudentLayout.tsx renders
    │
    │  StudentLayout.tsx ALSO does its own check:
    │  const token = localStorage.getItem("token")
    │  if (!token) → <Navigate to="/login" />
    │
    ▼
Page component renders
```

> ⚠️ **Double token check:** `ProtectedRoute` checks for both `"access_token"` and `"token"`. `StudentLayout` checks only for `"token"`. `Login.tsx` saves as `"token"`. `auth.service.ts → login()` also saves as `"token"`. This is consistent for the login path, but `ProtectedRoute` also accepts `"access_token"` which is never written anywhere — making that branch dead code.

---

## Token Usage in API Requests

```
api.ts (Axios instance)
    │
    │  interceptors.request.use((config) => {
    │      const token = localStorage.getItem("token")
    │      if (token) {
    │          config.headers.Authorization = `Bearer ${token}`
    │      }
    │      return config
    │  })
    │
    ▼
Every Axios request automatically sends:
Authorization: Bearer <JWT>
```

> ✅ The interceptor is correctly implemented. All requests get the token attached.

---

## `/auth/me` Endpoint Flow

```
Frontend calls getMe():
    │
    ▼
GET /auth/me
Authorization: Bearer <JWT>
    │
    │  FastAPI: oauth2_scheme extracts token from header
    │  jwt.decode(token, "supersecret", algorithms=["HS256"])
    │  return { "student_id": payload["sub"] }
    │
    ▼
Frontend receives: { "student_id": "CS001" }
```

> ⚠️ **Critical Bug:** The `jwt.decode()` call has NO `try/except`. If the token is:
> - Expired → `jose.ExpiredSignatureError` → unhandled 500
> - Tampered → `jose.JWTError` → unhandled 500
> - Missing → OAuth2 returns 401 automatically (this part works)
>
> The correct behavior would be to catch `JWTError` and raise `HTTPException(status_code=401)`.

---

## Role-Based Access Control Analysis

### Current State: **None implemented**

```
JWT Payload:
{ "sub": "CS001", "exp": <timestamp> }
```

There is **no `role` field** in the JWT. The only role distinction happens client-side in `Login.tsx`:

```typescript
if (username === "admin") {
    navigate("/admin", { replace: true });
} else {
    navigate("/student", { replace: true });
}
```

**Implications:**
1. Any student can manually navigate to `http://localhost:5173/admin` in their browser.
2. `ProtectedRoute` only checks if a token exists — not what the token contains.
3. The backend has no admin-only route guards. Any authenticated or even unauthenticated caller can reach all endpoints.
4. There is no `admin` account in the `students` table by default — "admin" would need to be registered as a student first.

---

## Registration Flow (Frontend `Register.tsx`)

```
Browser (Register.tsx)
    │
    │  User fills: studentId, name, department, password
    │  handleRegister() fires
    │  Sends JSON body:
    │  { student_id, name, department, password }
    │
    ▼
POST http://localhost:8000/auth/register
Content-Type: application/json
    │
    │  ❌ MISMATCH:
    │  Backend expects: ?student_id=...&name=...&department=...&password=...
    │  (Query parameters, not request body)
    │
    ▼
HTTP 422 Unprocessable Entity
```

> 🔴 **Bug:** The `/auth/register` endpoint uses plain function parameters (`def register(student_id: str, name: str, ...)`), which FastAPI maps to **query parameters**, not a request body. The frontend sends a JSON body. This will always fail with 422.
>
> Additionally, `/auth/register` stores the student WITHOUT a face embedding. For face recognition attendance to work, students must be registered via `/students/register` (with photo) through the Admin panel's `AddStudentModal`.

---

## Auth State Management

There is **no global auth state** (no React Context, no Zustand, no Redux).

| Where | What it does |
|-------|-------------|
| `Login.tsx` | Sets `localStorage.token` on success |
| `ProtectedRoute.tsx` | Reads `localStorage.token` or `localStorage.access_token` |
| `StudentLayout.tsx` | Reads `localStorage.token` (redundant check) |
| `api.ts` interceptor | Reads `localStorage.token` for every request |
| `auth.service.ts → login()` | Sets `localStorage.token` (duplicate of Login.tsx) |
| `useAuth.ts` | **EMPTY** — never implemented |
| `providers.tsx` | **EMPTY** — never implemented |

> ⚠️ Since `auth.service.ts → login()` is imported but `Login.tsx` makes the API call directly (not through `auth.service.ts`), the `login()` function in `auth.service.ts` is effectively dead code.

---

## Logout

**There is no logout functionality** anywhere in the codebase. No logout button, no `localStorage.removeItem("token")` call, no route for it. Users remain "logged in" until the JWT expires (8 hours) or they manually clear browser storage.
