# Current Architecture
> Audit Date: 2026-05-23 | Read-only analysis. No changes made.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    THREE-TIER SYSTEM                        │
│                                                             │
│  ┌──────────────────┐     ┌──────────────────────────────┐ │
│  │  React Frontend  │────▶│  FastAPI Backend API         │ │
│  │  (Port 5173)     │     │  (Port 8000)                 │ │
│  │                  │     │                              │ │
│  │  Admin Dashboard │     │  /auth/*  (Login, Register,  │ │
│  │  Student Portal  │     │           /me)               │ │
│  └──────────────────┘     │  /students/* (CRUD + embed)  │ │
│                           │  /attendance/* (mark/stats)  │ │
│  ┌──────────────────┐     └──────────────┬───────────────┘ │
│  │  Attendance Svc  │────────────────────┘                 │
│  │  (Standalone Py) │  HTTP POST /attendance/mark          │
│  │                  │                                      │
│  │  OpenCV Webcam   │     ┌──────────────────────────────┐ │
│  │  MTCNN Detection │     │  SQLite Database             │ │
│  │  FaceNet Embed   │     │  database/attendance.db      │ │
│  │  MediaPipe Blink │     │                              │ │
│  └──────────────────┘     │  TABLE: students             │ │
│                           │  TABLE: attendance           │ │
│                           └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure (Actual)

```
face-attendance-system/
│
├── backend_api/                    # FastAPI app (serves both UI and Attendance Svc)
│   ├── __init__.py
│   ├── main.py                     # App factory, CORS, router registration
│   └── routers/
│       ├── __init__.py
│       ├── auth.py                 # /auth/* — login, register, /me
│       ├── students.py             # /students/* — register w/ face, list, embedding
│       └── attendance.py           # /attendance/* — mark, today, history, stats
│
├── backend/                        # Legacy Phase 1 scripts + DB connection
│   ├── __init__.py
│   ├── database.py                 # SQLite connection helper (shared by API routers)
│   ├── init_db.py                  # One-time DB initialization script
│   ├── register_student.py         # Legacy: CLI-based student registration (Phase 1)
│   ├── mark_attendance.py          # Legacy: CLI-based webcam attendance (Phase 1)
│   ├── test_attendance.py          # Stub test file (essentially empty)
│   ├── test_env.py                 # Stub test file (essentially empty)
│   └── test_register.py            # Minimal test for registration
│
├── attendance_service/             # Live webcam attendance service (Phase 2)
│   ├── config.py                   # CAMERA_INDEX, FACE_THRESHOLD, FRAME_SKIP
│   ├── main.py                     # Entry point: webcam loop, voting, liveness gate
│   ├── face_recognizer.py          # MTCNN + FaceNet inference + cosine match
│   ├── liveness.py                 # MediaPipe FaceMesh blink detector
│   ├── api_client.py               # HTTP POST to /attendance/mark
│   ├── cache_builder.py            # Fetches all embeddings from API → pkl file
│   ├── students_cache.pkl          # Serialized face embedding cache
│   └── requirements.txt            # (empty file)
│
├── database/
│   └── attendance.db               # SQLite database file
│
├── models/
│   └── face_test.py                # Phase 0 proof-of-concept MTCNN/FaceNet test
│
├── frontend/                       # React 19 + TypeScript + Vite + TailwindCSS 4
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx                # App entry: RouterProvider
│       ├── index.css               # Global CSS (97 bytes — minimal)
│       ├── App.css                 # (unused)
│       ├── app/
│       │   ├── routes.tsx          # Central router definition (createBrowserRouter)
│       │   └── providers.tsx       # EMPTY — never implemented
│       ├── layouts/
│       │   ├── AdminLayout.tsx     # Sidebar nav + <Outlet />
│       │   ├── StudentLayout.tsx   # Sidebar nav + <Outlet /> + inline auth check
│       │   └── AuthLayout.tsx      # EMPTY — never implemented
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── Login.tsx       # Login form → /auth/login
│       │   │   └── Register.tsx    # Register form → /auth/register (BROKEN: JSON vs QP)
│       │   ├── admin/
│       │   │   ├── Dashboard.tsx   # Polls /attendance/today + /students/all every 10s
│       │   │   ├── Students.tsx    # Lists students, opens AddStudentModal
│       │   │   ├── Attendance.tsx  # Today's attendance, Export CSV, polls every 5s
│       │   │   └── Reports.tsx     # Full history table, Export CSV
│       │   └── student/
│       │       ├── Dashboard.tsx   # Recharts PieChart (present vs absent)
│       │       ├── Attendance.tsx  # History table, month filter, 7-day filter, CSV
│       │       └── Webcam.tsx      # Browser webcam display + manual mark button
│       ├── components/
│       │   ├── admin/
│       │   │   └── AddStudentModal.tsx  # Form: studentId, name, dept, password, image
│       │   ├── charts/             # EMPTY DIRECTORY
│       │   ├── common/             # EMPTY DIRECTORY
│       │   └── ui/                 # EMPTY DIRECTORY (implied from list_dir)
│       ├── routes/
│       │   ├── ProtectedRoute.tsx  # Checks localStorage for 'token' or 'access_token'
│       │   └── adminRoutes.tsx     # FULLY COMMENTED OUT — dead code
│       ├── services/
│       │   ├── api.ts              # Axios instance + request interceptor (Bearer token)
│       │   ├── auth.service.ts     # login() + getMe()
│       │   ├── attendance.service.ts  # getStats(), getRecords(), getToday(), getHistory()
│       │   └── students.ts         # getAllStudents(), registerStudent()
│       ├── hooks/
│       │   └── useAuth.ts          # EMPTY — never implemented
│       └── utils/
│           ├── exportCsv.ts        # exportAttendanceCsv() — generates and downloads CSV
│           └── formatters.ts       # EMPTY — never implemented
│
├── docs/                           # (This audit — being written now)
├── venv/                           # Python virtual environment
├── .gitignore
├── README.md
└── codeBugsAndSol.txt              # Developer notes / design decisions log
```

---

## Data Flow Architecture

### A. Student Registration Flow
```
Admin UI (AddStudentModal)
    │
    ▼
POST /students/register  [multipart/form-data]
    │
    ▼
FastAPI students.py router
    │
    ├─► MTCNN: detect face in image
    ├─► FaceNet: generate 512-dim embedding
    ├─► SQLite INSERT into students table (pickle blob)
    └─► Append to students_cache.pkl
```

### B. Live Attendance Flow
```
attendance_service/main.py
    │
    ├─► build_cache() → GET /students/all + GET /students/{id}/embedding
    │   └─► writes students_cache.pkl
    │
    ├─► load_students() → reads students_cache.pkl
    │
    └─► webcam loop:
        ├─► cv2.VideoCapture.read()
        ├─► recognize_faces(frame, students, threshold)
        │   ├─► MTCNN.detect() → bounding boxes
        │   ├─► MTCNN() → aligned face tensors
        │   └─► FaceNet → 512-dim embedding → cosine_similarity vs all stored
        ├─► BlinkDetector.process(frame) → MediaPipe FaceMesh EAR
        ├─► Vote buffer (last 10 frames, need 6 votes)
        ├─► Cooldown check (5 min per student)
        └─► mark_attendance(student_id) → POST /attendance/mark
```

### C. Dashboard Data Flow
```
Admin Dashboard
    │
    ├─► GET /students/all → totalStudents count
    ├─► GET /attendance/today → total_present, records[]
    └─► setInterval(10000) — auto-refresh

Admin Attendance Page
    │
    ├─► GET /attendance/today → date, total_present, records[]
    └─► setInterval(5000) — auto-refresh (most aggressive polling)

Admin Reports Page
    │
    └─► GET /attendance/history → all records sorted by date DESC

Student Dashboard
    │
    ├─► GET /auth/me → { student_id }
    └─► GET /attendance/student/{id} → present, total_classes, percentage

Student Attendance Page
    │
    ├─► GET /auth/me → { student_id }
    └─► GET /attendance/student/{id}/records → date, time records
```

---

## Technology Versions (Confirmed)

| Technology | Version |
|---|---|
| React | 19.2.0 |
| react-router-dom | 7.13.0 |
| Recharts | 3.7.0 |
| Axios | 1.13.2 |
| TailwindCSS | 4.1.18 |
| Vite | 7.2.4 |
| TypeScript | ~5.9.3 |
| FastAPI | (not pinned in requirements) |
| python-jose | (not pinned) |
| passlib | (not pinned) |
| facenet-pytorch | (not pinned) |
| SQLite | stdlib |

---

## Process Model

The system requires **3 separate processes** running simultaneously for full functionality:

| Process | Command | Port |
|---|---|---|
| Backend API | `uvicorn backend_api.main:app --reload` | 8000 |
| Frontend | `cd frontend && npm run dev` | 5173 |
| Attendance Service | `cd attendance_service && python main.py` | (no port, HTTP client) |

> **Critical:** The attendance service MUST be run from inside the `attendance_service/` directory due to bare relative imports (`from config import ...`).
