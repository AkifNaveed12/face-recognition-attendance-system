# Frontend Analysis
> Audit Date: 2026-05-23 | Read-only analysis. No changes made.

---

## Tech Stack

| Technology | Version |
|-----------|---------|
| React | 19.2.0 |
| TypeScript | ~5.9.3 |
| Vite | 7.2.4 |
| TailwindCSS | 4.1.18 |
| react-router-dom | 7.13.0 |
| Recharts | 3.7.0 |
| Axios | 1.13.2 |

---

## Routing Structure (`src/app/routes.tsx`)

```
/                    → redirect /login
/login               → Login.tsx
/register            → Register.tsx
/admin               → ProtectedRoute → AdminLayout
  /admin             →   AdminDashboard (index)
  /admin/students    →   Students.tsx
  /admin/attendance  →   Attendance.tsx
  /admin/reports     →   Reports.tsx
/student             → ProtectedRoute → StudentLayout
  /student           →   StudentDashboard (index)
  /student/attendance→   StudentAttendance.tsx
*                    → redirect /login
```

**Observations:**
- `Webcam.tsx` exists but is NOT registered — unreachable
- `adminRoutes.tsx` fully commented out — dead file
- No lazy loading — all components eagerly bundled
- No 404 page — catch-all redirects to login

---

## Protected Route

```tsx
// ProtectedRoute.tsx
const token = localStorage.getItem("access_token") || localStorage.getItem("token");
if (!token) return <Navigate to="/login" replace />;
return <>{children}</>;
```

- Token presence only — no expiry or signature validation
- `"access_token"` key is never written anywhere — dead branch
- No role check — any user with ANY token reaches any route

---

## Layouts

| Layout | Notes |
|--------|-------|
| AdminLayout | Sidebar: Dashboard, Students, Attendance, Reports. No logout. |
| StudentLayout | Sidebar: Dashboard, Attendance. Has redundant auth check. No logout. |
| AuthLayout | **EMPTY FILE** — 0 bytes |

---

## Page Status Summary

| Page | Status | Key Issue |
|------|--------|-----------|
| Login.tsx | ✅ Working | Makes direct API call, bypasses `auth.service.ts` |
| Register.tsx | ❌ Broken | Sends JSON; backend expects query params → 422 |
| admin/Dashboard.tsx | ✅ Working | Polls every 10s; charts disabled (React 19 note) |
| admin/Students.tsx | ✅ Working | No pagination, no delete/edit |
| admin/Attendance.tsx | ✅ Working | Polls every 5s; shows only student_id (no name) |
| admin/Reports.tsx | ✅ Working | Full history; no pagination |
| student/Dashboard.tsx | ✅ Working | Recharts PieChart, fetches once |
| student/Attendance.tsx | ✅ Working | Month filter hardcoded (Jan/Feb 2026 only) |
| student/Webcam.tsx | ⚠️ Stub | No route registered; manual mark, no AI |

---

## Service Layer

| File | Status | Notes |
|------|--------|-------|
| `api.ts` | ✅ Working | Axios + Bearer interceptor; reads `localStorage.token` |
| `auth.service.ts` | ⚠️ Partial | `login()` is dead code; `getMe()` actively used |
| `attendance.service.ts` | ✅ Working | 4 functions, proper TypeScript interfaces |
| `students.ts` | ✅ Working | `getAllStudents()` + `registerStudent(formData)` |

---

## State Management

No global state. Every page uses local `useState` + `useEffect`. No React Context, no Zustand, no React Query. Auth state is `localStorage` reads per-component. `useAuth.ts` exists as an empty file — was planned, never built.

---

## Polling Summary

| Page | Interval |
|------|----------|
| Admin Dashboard | 10,000ms |
| Admin Attendance | 5,000ms (most aggressive) |
| Admin Reports | None (once) |
| Student pages | None (once) |

All use `clearInterval` on unmount correctly.

---

## Dead / Empty Files

| File | State |
|------|-------|
| `src/hooks/useAuth.ts` | 0 bytes |
| `src/app/providers.tsx` | 0 bytes |
| `src/layouts/AuthLayout.tsx` | 0 bytes |
| `src/utils/formatters.ts` | 0 bytes |
| `src/routes/adminRoutes.tsx` | All commented out |
| `src/pages/student/Webcam.tsx` | Built but no route |
| `src/components/charts/` | Empty directory |
| `src/components/common/` | Empty directory |
