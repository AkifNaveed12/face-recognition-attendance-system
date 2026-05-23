# Current System Analysis (Master Index)
> Audit Date: 2026-05-23 | Auditor: Senior Software Architect (AI)
> Phase: STABILIZATION — Read-Only. Zero code changes made.

---

## Quick Reference

| Document | Contents |
|----------|----------|
| [current-architecture.md](./current-architecture.md) | Full directory tree, data flow diagrams, technology versions, process model |
| [api-flow.md](./api-flow.md) | Every API endpoint, request/response shapes, auth requirements, status |
| [auth-flow.md](./auth-flow.md) | Login flow, JWT config, ProtectedRoute, role gaps, token key analysis |
| [attendance-flow.md](./attendance-flow.md) | AI webcam flow, liveness flow, manual flow, dedup logic, cache staleness |
| [current-bugs.md](./current-bugs.md) | 14 catalogued bugs with severity, files, and descriptions |
| [frontend-analysis.md](./frontend-analysis.md) | All pages, components, services, state management, dead files |
| [backend-analysis.md](./backend-analysis.md) | All routers, DB schema, security, legacy scripts |
| [attendance-service-analysis.md](./attendance-service-analysis.md) | AI pipeline, liveness, voting, cache, error handling, performance |

---

## System Status: Overall

```
Working Subsystems
──────────────────
✅ FastAPI server and all 12 routes respond correctly
✅ SQLite database (2 tables: students, attendance)
✅ JWT login (form-data → token issued)
✅ Student registration with face embedding (via admin modal)
✅ Attendance marking with per-day deduplication
✅ All attendance read endpoints (today, history, stats, records)
✅ Admin dashboard (polls every 10s)
✅ Admin students page + add student modal
✅ Admin attendance page (polls every 5s, CSV export)
✅ Admin reports page (full history, CSV export)
✅ Student dashboard (Recharts pie chart)
✅ Student attendance history (filters, CSV export)
✅ Webcam attendance service (MTCNN + FaceNet + blink liveness)
✅ Face embedding cache system

Broken / Incomplete Subsystems
────────────────────────────────
❌ /auth/register — 422 from frontend (JSON vs query params)
❌ /auth/me — 500 on expired/invalid token (no error handling)
❌ No role-based access control (any user reaches admin panel)
❌ useAuth.ts — empty file (no centralized auth state)
❌ AuthLayout.tsx — empty file
❌ providers.tsx — empty file
❌ Student Webcam page — no route registered (unreachable)
❌ Admin dashboard charts — disabled (React 19 compatibility note)
❌ Hardcoded JWT secret — "supersecret" in source code
❌ No logout anywhere in the frontend
```

---

## Top Priority Issues

| # | Issue | Severity | Effort to Fix |
|---|-------|----------|---------------|
| 1 | `/auth/me` crashes on expired token | 🔴 Critical | < 5 min |
| 2 | Hardcoded JWT secret | 🔴 Critical | < 15 min |
| 3 | `/auth/register` JSON vs query param mismatch | 🔴 Critical | < 15 min |
| 4 | No role-based access control | 🟠 High | Medium |
| 5 | Webcam service import path fragility | 🟠 High | < 10 min |
| 6 | Webcam loop exits on camera read error | 🟠 High | < 10 min |
| 7 | No logout functionality | 🟡 Medium | < 20 min |
| 8 | Cache stale after new student registered | 🟡 Medium | Medium |
| 9 | NULL embedding crash in `/students/{id}/embedding` | 🟡 Medium | < 10 min |
| 10 | All API endpoints unprotected except `/auth/me` | 🟡 Medium | Large |

---

## Dependency Map (Simplified)

```
Frontend
  └── axios → Backend API (port 8000)

Backend API
  └── auth.py → backend.database.get_connection()
  └── students.py → backend.database.get_connection()
                 → attendance_service/students_cache.pkl (write)
  └── attendance.py → backend.database.get_connection()

Attendance Service
  └── cache_builder.py → GET /students/all
                       → GET /students/{id}/embedding
                       → students_cache.pkl (write)
  └── face_recognizer.py → students_cache.pkl (read)
  └── api_client.py → POST /attendance/mark
  └── liveness.py → MediaPipe FaceMesh (local)
  └── main.py → all of the above

Database
  └── database/attendance.db
      ├── TABLE students (id, student_id, name, department, password, embedding)
      └── TABLE attendance (id, student_id, date, time)
```

---

## What Is Safe To Preserve As-Is

The following are working correctly and must not be touched during stabilization:

- `backend_api/main.py` — router registration and CORS
- `backend_api/routers/attendance.py` — all 5 endpoints working
- `backend_api/routers/students.py` — `/students/register`, `/students/all`, `/students/{id}/embedding`
- `backend/database.py` — `get_connection()` helper
- `attendance_service/face_recognizer.py` — full MTCNN+FaceNet pipeline
- `attendance_service/liveness.py` — MediaPipe blink detector
- `attendance_service/api_client.py` — HTTP client for mark attendance
- `attendance_service/config.py` — constants
- All frontend working pages: AdminDashboard, AdminStudents, AdminAttendance, AdminReports, StudentDashboard, StudentAttendance
- `frontend/src/services/attendance.service.ts`
- `frontend/src/services/students.ts`
- `frontend/src/services/api.ts`
- `frontend/src/utils/exportCsv.ts`
- `frontend/src/components/admin/AddStudentModal.tsx`
- `frontend/src/layouts/AdminLayout.tsx`
- `frontend/src/layouts/StudentLayout.tsx`
- `frontend/src/app/routes.tsx`
