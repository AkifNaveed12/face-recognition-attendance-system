import os
from dotenv import load_dotenv
from jose import jwt
from datetime import datetime, timedelta

# Load env file from parent directory (repo root)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

BACKEND_URL = "http://127.0.0.1:8000"

CAMERA_INDEX = 0        # default webcam
FACE_THRESHOLD = 0.75   # cosine similarity threshold
FRAME_SKIP = 5          # process every 5th frame

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "insecure-default-change-me")
ALGORITHM = "HS256"

def get_auth_headers():
    """Generates an authorization header signed with the shared JWT secret."""
    payload = {
        "sub": "admin",
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(days=365)  # Far-future expiry for local service
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"Authorization": f"Bearer {token}"}
