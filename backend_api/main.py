from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend_api.routers.auth import router as auth_router
from backend_api.routers.students import router as students_router
from backend_api.routers.attendance import router as attendance_router




from backend.database import create_tables

app = FastAPI(title="Face Attendance System API")

@app.on_event("startup")
def on_startup():
    print("[STARTUP] Starting FastAPI backend application...", flush=True)
    try:
        print("[STARTUP] Initializing SQLite database tables...", flush=True)
        create_tables()
        print("[STARTUP] Database tables initialized and seeded successfully.", flush=True)
    except Exception as e:
        print(f"[FATAL/STARTUP] Database initialization failed: {e}", flush=True)
        print("[FATAL/STARTUP] Continuing application startup so health check/diagnostics are reachable.", flush=True)

    print("[STARTUP] Registered API Routes:", flush=True)
    for route in app.routes:
        methods = getattr(route, "methods", None)
        methods_str = ",".join(methods) if methods else "GET"
        print(f"  {methods_str:10} {route.path}", flush=True)

app.include_router(auth_router)
app.include_router(students_router)
app.include_router(attendance_router)


import os

# Production CORS origins setup (Task Group 3)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://face-recognition-attendance-system-jet.vercel.app"
]
frontend_env = os.getenv("FRONTEND_URL")
if frontend_env:
    origins.extend([url.strip() for url in frontend_env.split(",") if url.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "API running"}

@app.get("/health")
def health_check():
    try:
        from backend.database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status
    }