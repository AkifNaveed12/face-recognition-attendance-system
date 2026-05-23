from fastapi import APIRouter, HTTPException, Depends
from datetime import date, datetime
from pydantic import BaseModel, Field
from backend.database import get_connection
from .auth import require_admin, get_current_user

router = APIRouter(
    prefix="/attendance",
    tags=["attendance"]
)

# ----------------------------
# Get today's attendance
# ----------------------------
@router.get("/today")
def today_attendance(admin_user: dict = Depends(require_admin)):
    today = date.today().isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT student_id, time FROM attendance WHERE date = ?",
        (today,)
    )

    rows = cursor.fetchall()
    conn.close()

    return {
        "date": today,
        "total_present": len(rows),
        "records": [
            {"student_id": r[0], "time": r[1]}
            for r in rows
        ]
    }

@router.get("/history")
def get_attendance_history(admin_user: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT student_id, date, time FROM attendance ORDER BY date DESC, time DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"student_id": r[0], "date": r[1], "time": r[2]}
        for r in rows
    ]


# ----------------------------
# ✅ NEW: Get FULL attendance records of a student
# (THIS FIXES FRONTEND TABLE + GRAPH)
# ----------------------------
@router.get("/student/{student_id}/records")
def student_attendance_records(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin" and current_user.get("student_id") != student_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own records")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT date, time FROM attendance WHERE student_id = ? ORDER BY date DESC",
        (student_id,)
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "date": r[0],
            "time": r[1]
        }
        for r in rows
    ]


# ----------------------------
# Get attendance stats of a student (KEEP THIS)
# ----------------------------
@router.get("/student/{student_id}")
def student_attendance(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin" and current_user.get("student_id") != student_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own stats")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM attendance WHERE student_id = ?",
        (student_id,)
    )
    present_count = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(DISTINCT date) FROM attendance"
    )
    total_classes = cursor.fetchone()[0]

    conn.close()

    percentage = (
        (present_count / total_classes) * 100
        if total_classes > 0 else 0
    )

    return {
        "student_id": student_id,
        "present": present_count,
        "total_classes": total_classes,
        "attendance_percentage": round(percentage, 2)
    }


class AttendanceMarkRequest(BaseModel):
    student_id: str = Field(..., min_length=2, max_length=50)

# ----------------------------
# Mark attendance
# ----------------------------
@router.post("/mark")
def mark_attendance(data: AttendanceMarkRequest, current_user: dict = Depends(get_current_user)):
    student_id = data.student_id

    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    time_now = now.strftime("%H:%M:%S")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT 1 FROM attendance WHERE student_id = ? AND date = ?",
        (student_id, today)
    )

    if cursor.fetchone():
        conn.close()
        return {
            "status": "already_marked",
            "student_id": student_id,
            "date": today
        }

    cursor.execute(
        "INSERT INTO attendance (student_id, date, time) VALUES (?, ?, ?)",
        (student_id, today, time_now)
    )

    conn.commit()
    conn.close()

    return {
        "status": "marked",
        "student_id": student_id,
        "date": today,
        "time": time_now
    }
