import os
import sys
import sqlite3

from io import BytesIO
from PIL import Image
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


from backend_api.main import app
from backend_api.routers.auth import create_token
from backend.database import get_connection

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "API running"}

def test_unauthorized_access():
    # Verify protected endpoints return 401
    assert client.get("/students/all").status_code == 401
    assert client.get("/attendance/today").status_code == 401
    assert client.post("/attendance/mark", json={"student_id": "CS001"}).status_code == 401

def test_pydantic_validation():
    # Generate admin token
    admin_token = create_token("admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Empty payload to /attendance/mark
    response = client.post("/attendance/mark", json={}, headers=headers)
    assert response.status_code == 422  # Unprocessable Entity

    # Invalid length student_id
    response = client.post("/attendance/mark", json={"student_id": ""}, headers=headers)
    assert response.status_code == 422  # Unprocessable Entity

def test_duplicate_student_integrity():
    # Registering a duplicate student_id should raise 400 instead of 500
    admin_token = create_token("admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Setup database with a mock user CS999 directly
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE student_id = ?", ("CS999",))
    cursor.execute(
        "INSERT INTO students (student_id, name, department, password, embedding) VALUES (?, ?, ?, ?, ?)",
        ("CS999", "Duplicate Test", "CS", "hashed_pwd", b"fake_embedding")
    )
    conn.commit()
    conn.close()

    # Now attempt to register CS999 again via API
    # Create mock image file
    img_io = BytesIO()
    Image.new("RGB", (100, 100), color="white").save(img_io, "JPEG")
    img_io.seek(0)

    form_data = {
        "student_id": "CS999",
        "name": "Duplicate Test",
        "department": "CS",
        "password": "password123"
    }
    files = {
        "image": ("test.jpg", img_io, "image/jpeg")
    }

    # We expect a 400 Bad Request (student already registered) or 400 "No face detected" depending on mtcnn.
    # Either way, it should NOT return 500.
    response = client.post("/students/register", data=form_data, files=files, headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] in ["Student ID is already registered", "No face detected"]

def test_attendance_flow():
    # Generate tokens
    admin_token = create_token("admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Mark attendance for CS999
    response = client.post("/attendance/mark", json={"student_id": "CS999"}, headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] in ["marked", "already_marked"]

    # Mark attendance for CS999 a second time (should return already_marked)
    response2 = client.post("/attendance/mark", json={"student_id": "CS999"}, headers=headers)
    assert response2.status_code == 200
    assert response2.json()["status"] == "already_marked"

    # Verify admin today's records has CS999
    resp_today = client.get("/attendance/today", headers=headers)
    assert resp_today.status_code == 200
    records = resp_today.json()["records"]
    assert any(r["student_id"] == "CS999" for r in records)

    # Clean up test data
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE student_id = ?", ("CS999",))
    cursor.execute("DELETE FROM attendance WHERE student_id = ?", ("CS999",))
    conn.commit()
    conn.close()

def test_service_api_key_auth():
    # Setup test student CS999 in DB
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE student_id = ?", ("CS999",))
    cursor.execute(
        "INSERT INTO students (student_id, name, department, password, embedding) VALUES (?, ?, ?, ?, ?)",
        ("CS999", "Service Test", "CS", "pwd", b"fake_embedding")
    )
    conn.commit()
    conn.close()

    # Valid X-API-KEY headers (default key is "dev-service-api-key" if env not set)
    valid_headers = {"X-API-KEY": "dev-service-api-key"}
    invalid_headers = {"X-API-KEY": "wrong-api-key"}

    # 1. Access with invalid key -> 403 Forbidden
    assert client.get("/students/all", headers=invalid_headers).status_code == 403
    assert client.post("/attendance/mark", json={"student_id": "CS999"}, headers=invalid_headers).status_code == 403

    # 2. Access with valid key -> 200 OK
    assert client.get("/students/all", headers=valid_headers).status_code == 200
    
    # Mark attendance with valid key
    resp = client.post("/attendance/mark", json={"student_id": "CS999"}, headers=valid_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] in ["marked", "already_marked"]

    # Clean up
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE student_id = ?", ("CS999",))
    cursor.execute("DELETE FROM attendance WHERE student_id = ?", ("CS999",))
    conn.commit()
    conn.close()

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "database" in data

if __name__ == "__main__":
    test_root()
    test_unauthorized_access()
    test_pydantic_validation()
    test_duplicate_student_integrity()
    test_attendance_flow()
    test_service_api_key_auth()
    test_health_endpoint()
    print("==============================================")
    print("ALL INTEGRATION AND EDGE-CASE TESTS PASSED!")
    print("==============================================")
