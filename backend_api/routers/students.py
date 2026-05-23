from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
import torch
import pickle
from io import BytesIO
from PIL import Image
from facenet_pytorch import MTCNN, InceptionResnetV1
from backend.database import get_connection
import sqlite3
import os
from .auth import require_admin

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE_PATH = os.path.join(ROOT_DIR, "attendance_service", "students_cache.pkl")

router = APIRouter(
    prefix="/students",
    tags=["students"],
)

# Device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load models ONCE
mtcnn = MTCNN(
    image_size=160,
    margin=20,
    keep_all=True,
    device=device
)

facenet = InceptionResnetV1(
    pretrained="vggface2"
).eval().to(device)


@router.post("/register")
async def register_student(
    student_id: str = Form(...),
    name: str = Form(...),
    department: str = Form(...),
    password: str = Form(...),
    image: UploadFile = File(...),
    admin_user: dict = Depends(require_admin)
):
    try:
        from .auth import pwd_context
        hashed_password = pwd_context.hash(password)

        image_bytes = await image.read()
        img = Image.open(BytesIO(image_bytes)).convert("RGB")

        faces = mtcnn(img)
        if faces is None or len(faces) == 0:
            raise HTTPException(status_code=400, detail="No face detected")

        face = faces[0].unsqueeze(0).to(device)

        with torch.no_grad():
            embedding = facenet(face)

        emb_np = embedding.cpu().numpy()[0]  # shape (512,)

        # save to DB
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO students (student_id, name, department, password, embedding) VALUES (?, ?, ?, ?, ?)",
            (student_id, name, department, hashed_password, pickle.dumps(embedding.cpu().numpy()))
        )
        conn.commit()
        conn.close()

        # ✅ WRITE CLEAN CACHE ENTRY
        os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)

        cache = []
        if os.path.exists(CACHE_PATH):
            with open(CACHE_PATH, "rb") as f:
                cache = pickle.load(f)

        cache.append({
            "student_id": student_id,
            "name": name,
            "embedding": emb_np.tolist()
        })

        with open(CACHE_PATH, "wb") as f:
            pickle.dump(cache, f)

        return {
            "message": "Student registered successfully",
            "student_id": student_id
        }

    except HTTPException:
        raise
    except sqlite3.IntegrityError as e:
        print(f"ERROR: Student registration uniqueness conflict: {e}")
        raise HTTPException(
            status_code=400,
            detail="Student ID is already registered"
        )
    except Exception as e:
        print(f"ERROR: Student registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all")
def get_all_students(admin_user: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT student_id, name, department FROM students")
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "student_id": r[0],
            "name": r[1],
            "department": r[2]
        }
        for r in rows
    ]

@router.get("/{student_id}/embedding")
def get_student_embedding(student_id: str, admin_user: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT student_id, name, embedding FROM students WHERE student_id = ?",
        (student_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Student not found")

    if not row[2]:
        raise HTTPException(status_code=400, detail="Student embedding is missing or not initialized")

    try:
        embedding = pickle.loads(row[2])[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deserialize embedding data: {e}")

    return {
        "student_id": row[0],
        "name": row[1],
        "embedding": embedding.tolist()
    }
