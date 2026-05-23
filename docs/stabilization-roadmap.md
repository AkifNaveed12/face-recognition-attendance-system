# Face Recognition Attendance System — Stabilization Roadmap

> Status: ACTIVE STABILIZATION PHASE
> Project Type: AI-Based Full Stack Attendance System
> Architecture: React + FastAPI + FaceNet + OpenCV + SQLite
> Strategy: Controlled Stabilization (NO Rewrites)
> Maintainer: Akif Naveed
> Audit Phase Completed: ✅

---

# 1. PROJECT STABILIZATION OBJECTIVE

The objective of this stabilization phase is:

- preserve the existing working architecture
- eliminate runtime instability
- harden authentication and security
- stabilize the attendance AI service
- validate all frontend/backend integrations
- ensure deployment readiness
- avoid unnecessary refactors
- avoid architecture drift
- ensure every module is production-safe for university/project deployment

This project is NOT undergoing a rewrite.

This is a:

# controlled engineering stabilization effort.

---

# 2. CORE ENGINEERING PRINCIPLES

## RULE #1 — NO RANDOM REFACTORS

Never:

- rewrite entire modules
- restructure architecture unnecessarily
- replace working systems
- introduce unnecessary frameworks
- optimize prematurely

Only:

- surgical fixes
- controlled improvements
- isolated validation

---

## RULE #2 — PRESERVE STABLE SYSTEMS

The following systems are considered STABLE and must not be rewritten casually:

### AI Core

- MTCNN detection pipeline
- FaceNet embedding generation
- cosine similarity matching
- vote buffer architecture
- MediaPipe liveness logic

### Backend Core

- router structure
- attendance marking flow
- database connection structure
- API grouping architecture

### Frontend Core

- routing hierarchy
- layout architecture
- service layer structure
- dashboard page structure

---

## RULE #3 — ONE TASK = ONE BRANCH

Every task must be isolated in its own branch.

Example:

```bash
git checkout -b fix/auth-t0-token-validation
```

Never mix unrelated fixes in one branch.

---

## RULE #4 — TEST BEFORE MERGE

No code reaches:

- dev/stabilization
- main

unless:

- tested
- validated
- regression-checked

---

# 3. BRANCH STRATEGY

## Branch Hierarchy

```text
main
│
├── dev/stabilization
│
├── fix/auth-t0-token-validation
├── fix/auth-t1-centralized-auth
├── fix/auth-t2-rbac
│
├── fix/attendance-t0-camera-recovery
├── fix/attendance-t1-cache-refresh
│
├── fix/api-t0-route-protection
├── fix/api-t1-validation-models
│
├── fix/frontend-t0-auth-context
├── fix/frontend-t1-error-handling
│
└── fix/testing-t0-system-validation
```

---

## Branch Rules

### `main`

- always deployable
- fully stable only
- protected branch

### `dev/stabilization`

- integration branch
- validated fixes merged here first
- acts as pre-production branch

### `fix/*`

- isolated task branches
- single-task scope only
- deleted after merge

---

# 4. MERGE POLICY

## Merge Flow

```text
fix/task-branch
    ↓
validated locally
    ↓
merged into dev/stabilization
    ↓
full-system validation
    ↓
merged into main
```

---

## Merge Requirements

A task branch CANNOT merge unless:

- project builds successfully
- backend launches successfully
- frontend launches successfully
- attendance service launches successfully
- no unrelated modules break
- edge cases tested
- logs checked
- no temporary debug code remains

---

# 5. VALIDATION RULES

Every fix MUST include:

## A. Root Cause Validation

- reproduce bug
- identify exact failure point
- identify affected files
- identify dependency impact

---

## B. Minimal Fix Scope

Fix ONLY:

- the root issue
- directly affected systems

Avoid:

- opportunistic refactors
- unrelated cleanup

---

## C. Regression Validation

After EVERY fix validate:

### Backend

- API launches
- routes respond
- JWT works
- DB writes work

### Frontend

- routes render
- dashboards load
- no console errors
- auth flow stable

### Attendance Service

- webcam opens
- recognition works
- liveness works
- attendance marks correctly

---

# 6. ROLLBACK DISCIPLINE

Every task must be reversible.

Before changes:

```bash
git status
git add .
git commit -m "pre-fix snapshot"
```

If regression occurs:

```bash
git reset --hard HEAD~1
```

No task should ever leave the system in an unstable state.

---

# 7. PHASE EXECUTION PLAN

# PHASE 1 — AUTH & SECURITY STABILIZATION

Priority: 🔴 CRITICAL

Goal:
Stabilize authentication architecture and secure the system.

---

## AUTH-T0 — Fix `/auth/me` Token Validation

### Problem

Expired or invalid JWT crashes backend with 500.

### Root Cause

Missing try/except around `jwt.decode()`.

### Files

- backend_api/routers/auth.py

### Tasks

- catch ExpiredSignatureError
- catch JWTError
- return HTTP 401
- standardize auth error responses

### Validation

- expired token returns 401
- tampered token returns 401
- valid token still works

### Risk

LOW

---

## AUTH-T1 — Centralize Frontend Auth State

### Problem

Auth state scattered across localStorage reads.

### Files

- frontend/src/hooks/useAuth.ts
- frontend/src/app/providers.tsx
- frontend/src/routes/ProtectedRoute.tsx
- frontend/src/layouts/StudentLayout.tsx

### Tasks

- implement AuthProvider
- implement useAuth()
- centralize token state
- remove duplicate checks

### Validation

- login works
- logout works
- refresh persists session
- route protection works

### Risk

MEDIUM

---

## AUTH-T2 — Implement Logout System

### Tasks

- add logout button
- clear token
- redirect to login
- invalidate auth state

### Validation

- logout clears session
- protected routes blocked afterward

---

## AUTH-T3 — JWT Secret Environment Variable

### Problem

Hardcoded SECRET_KEY.

### Tasks

- move SECRET_KEY to .env
- add env loader
- update README/docs

### Validation

- token signing still works
- app boots without errors

---

## AUTH-T4 — Implement RBAC

### Tasks

- add role field to JWT
- add role field to users/admin
- create admin-only route guards
- protect admin frontend routes

### Validation

- student cannot access /admin
- admin access works correctly

### Risk

HIGH

---

# PHASE 2 — ATTENDANCE SERVICE STABILIZATION

Priority: 🔴 CRITICAL

Goal:
Eliminate webcam instability and runtime fragility.

---

## ATTENDANCE-T0 — Camera Recovery Logic

### Problem

Single frame failure kills webcam loop.

### Files

- attendance_service/main.py

### Tasks

- replace `break` logic
- implement retry attempts
- implement camera reconnect logic
- add recovery logs

### Validation

- temporary camera disconnect recovers
- service stays alive

### Risk

MEDIUM

---

## ATTENDANCE-T1 — Startup Resilience

### Problem

Backend offline crashes service instantly.

### Tasks

- add retry mechanism
- add graceful startup validation
- add backend availability checks

### Validation

- service waits for backend
- no instant crash

---

## ATTENDANCE-T2 — Cache Refresh Lifecycle

### Problem

New students require service restart.

### Tasks

- implement cache refresh trigger
- reload in-memory students safely

### Validation

- newly added student recognized without restart

### Risk

HIGH

---

## ATTENDANCE-T3 — Vote Buffer Logic Fix

### Problem

Old True votes persist incorrectly.

### Tasks

- append False on non-recognition
- properly decay vote confidence

### Validation

- stale recognition removed correctly

---

## ATTENDANCE-T4 — Blink State Reset Fix

### Problem

blinked=True persists after failed mark.

### Tasks

- reset blink state safely
- enforce fresh blink requirement

### Validation

- repeated marks require new blink

---

# PHASE 3 — API HARDENING

Priority: 🟠 HIGH

---

## API-T0 — Protect Sensitive Routes

### Tasks

Protect:

- /students/register
- /students/all
- /students/{id}/embedding
- /attendance/history

### Validation

- unauthorized requests rejected
- admin requests succeed

---

## API-T1 — Add Request Validation Models

### Tasks

- add Pydantic models
- validate request bodies
- standardize API schemas

---

## API-T2 — Secure Embedding Access

### Tasks

- restrict embedding endpoint
- allow attendance_service access only

---

# PHASE 4 — FRONTEND STABILIZATION

Priority: 🟡 MEDIUM

---

## FRONTEND-T0 — Error Handling Layer

### Tasks

- session expiry UI
- API failure messages
- loading states

---

## FRONTEND-T1 — Cleanup Dead Files

### Remove

- dead routes
- empty stubs
- commented code

ONLY after stabilization complete.

---

## FRONTEND-T2 — Restore Admin Charts

### Tasks

- validate Recharts compatibility
- safely re-enable charts

---

# PHASE 5 — TESTING & VALIDATION

Priority: 🔴 CRITICAL

---

## TEST-T0 — Full System Validation

### Validate

- login
- registration
- JWT
- admin routes
- student routes
- attendance marking
- dashboard polling
- CSV export
- cache refresh
- camera recovery

---

## TEST-T1 — Edge Case Testing

### Cases

- invalid token
- camera disconnect
- backend offline
- duplicate attendance
- empty DB
- invalid image
- no face detected
- multiple faces
- expired session

---

# PHASE 6 — DEPLOYMENT READINESS

Priority: 🟡 MEDIUM

---

## DEPLOY-T0 — Environment Cleanup

### Tasks

- remove debug prints
- clean unused files
- finalize .gitignore
- pin requirements

---

## DEPLOY-T1 — Production Documentation

### Create

- deployment guide
- architecture diagrams
- API docs
- testing guide

---

# 8. TESTING POLICY

Every fix MUST include:

## Functional Testing

- direct feature validation

## Integration Testing

- frontend ↔ backend
- backend ↔ attendance service

## Regression Testing

- ensure unrelated modules unaffected

## Restart Testing

- restart all 3 services
- validate startup behavior

---

# 9. DEPLOYMENT READINESS CHECKLIST

Before final merge into `main`:

## Backend

- launches cleanly
- no unhandled exceptions
- auth secured

## Frontend

- no console errors
- protected routes working
- logout working

## Attendance Service

- webcam stable
- recognition working
- recovery logic functional

## Database

- attendance writes valid
- no corruption
- no duplicate issues

## Security

- secrets removed from source
- protected routes enforced
- role validation functional

---

# 10. FINAL ENGINEERING OBJECTIVE

The final stabilized system must be:

- deployment-ready
- regression-safe
- secure
- maintainable
- fully documented
- architecturally preserved
- professionally testable

The objective is NOT to rewrite the project.

The objective is to:

# transform the current ambitious prototype into a stable engineering-grade AI attendance system.
