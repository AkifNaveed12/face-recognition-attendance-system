from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend_api.routers.auth import router as auth_router
from backend_api.routers.students import router as students_router
from backend_api.routers.attendance import router as attendance_router




from backend.database import create_tables

app = FastAPI(title="Face Attendance System API")

@app.on_event("startup")
def on_startup():
    create_tables()

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