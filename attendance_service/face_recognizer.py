import torch
import pickle
import numpy as np
from facenet_pytorch import MTCNN, InceptionResnetV1
from sklearn.metrics.pairwise import cosine_similarity
from PIL import Image
import os

# ----------------------------
# Device
# ----------------------------
device = "cuda" if torch.cuda.is_available() else "cpu"

# ----------------------------
# Models
# ----------------------------
mtcnn = MTCNN(
    image_size=160,
    margin=20,
    keep_all=True,
    device=device
)

facenet = InceptionResnetV1(
    pretrained="vggface2"
).eval().to(device)

# ----------------------------
# Cache path
# ----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(BASE_DIR, "students_cache.pkl")

# ----------------------------
# Load students from cache
# ----------------------------
def load_students():
    if not os.path.exists(CACHE_PATH):
        print("[WARN] Cache file not found")
        return []

    try:
        with open(CACHE_PATH, "rb") as f:
            data = pickle.load(f)
    except Exception as e:
        print(f"[WARN] Failed to load cache file: {e}")
        return None

    students = []

    for s in data:
        try:
            if not isinstance(s, dict):
                continue

            emb = np.asarray(s["embedding"], dtype=np.float32)

            if emb.shape != (512,):
                continue

            students.append((
                s["student_id"],
                s["name"],
                emb
            ))
        except Exception:
            continue

    print(f"[INFO] Loaded {len(students)} valid embeddings")
    return students


# ----------------------------
# Face recognition + boxes
# ----------------------------
def recognize_faces(frame, students, threshold):
    img = Image.fromarray(frame).convert("RGB")

    # 1️⃣ Detect boxes FIRST
    boxes, _ = mtcnn.detect(img)

    # 2️⃣ Extract aligned faces
    faces = mtcnn(img)

    results = []

    if faces is None or boxes is None:
        return results

    for i in range(len(faces)):
        face = faces[i].to(device)          # [3, 160, 160]
        x1, y1, x2, y2 = boxes[i].astype(int)

        # ✅ Correct batching
        face = face.unsqueeze(0)            # [1, 3, 160, 160]

        with torch.no_grad():
            emb = facenet(face).cpu().numpy()[0]  # [512]

        best_score = 0.0
        best_match = None

        for sid, name, db_emb in students:
            score = cosine_similarity(
                emb.reshape(1, -1),
                db_emb.reshape(1, -1)
            )[0][0]

            if score > best_score:
                best_score = score
                best_match = (sid, name)

        if best_match and best_score >= threshold:
            results.append({
                "student_id": best_match[0],
                "name": best_match[1],
                "confidence": float(best_score),
                "box": [x1, y1, x2, y2]
            })

    return results


