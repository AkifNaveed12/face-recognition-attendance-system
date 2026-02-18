from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend_api.routers.auth import router as auth_router
from backend_api.routers.students import router as students_router
from backend_api.routers.attendance import router as attendance_router




app = FastAPI(title="Face Attendance System API")

app.include_router(auth_router)
app.include_router(students_router)
app.include_router(attendance_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "API running"}