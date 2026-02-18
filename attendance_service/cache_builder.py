import requests
import pickle
import os

API_BASE = "http://127.0.0.1:8000"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(BASE_DIR, "students_cache.pkl")


def build_cache():
    print("[INFO] Building students cache...")

    students = requests.get(f"{API_BASE}/students/all").json()
    cache = []

    for s in students:
        sid = s["student_id"]

        res = requests.get(f"{API_BASE}/students/{sid}/embedding")
        data = res.json()

        cache.append({
            "student_id": data["student_id"],
            "name": data["name"],
            "embedding": data["embedding"]
        })

    with open(CACHE_PATH, "wb") as f:
        pickle.dump(cache, f)

    print(f"[INFO] Cache built successfully ({len(cache)} students)")


if __name__ == "__main__":
    build_cache()
