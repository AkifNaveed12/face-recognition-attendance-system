import requests
import pickle
import os
from config import BACKEND_URL, get_auth_headers

API_BASE = BACKEND_URL

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(BASE_DIR, "students_cache.pkl")


def build_cache():
    print("[INFO] Building students cache...")

    headers = get_auth_headers()
    response = requests.get(f"{API_BASE}/students/all", headers=headers)
    response.raise_for_status()
    students = response.json()
    cache = []

    for s in students:
        sid = s["student_id"]
        if sid == "admin":
            continue

        try:
            res = requests.get(f"{API_BASE}/students/{sid}/embedding", headers=headers)
            res.raise_for_status()
            data = res.json()

            cache.append({
                "student_id": data["student_id"],
                "name": data["name"],
                "embedding": data["embedding"]
            })
        except Exception as e:
            print(f"[WARN] Skipping student {sid} because fetching embedding failed: {e}")

    with open(CACHE_PATH, "wb") as f:
        pickle.dump(cache, f)

    print(f"[INFO] Cache built successfully ({len(cache)} students)")


if __name__ == "__main__":
    build_cache()
