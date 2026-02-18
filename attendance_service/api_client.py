import requests

API_BASE = "http://127.0.0.1:8000"


def mark_attendance(student_id: str) -> bool:
    """
    Calls backend to mark attendance for a student.
    Returns True if attendance was marked successfully.
    """

    try:
        res = requests.post(
            f"{API_BASE}/attendance/mark",
            json={"student_id": student_id},
            timeout=5
        )

        res.raise_for_status()
        data = res.json()

        if data.get("status") == "marked":
            return True

        if data.get("status") == "already_marked":
            return False

        return False

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Attendance API failed for {student_id}: {e}")
        return False
