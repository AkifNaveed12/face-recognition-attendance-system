import os
from dotenv import load_dotenv

# Load env file from parent directory (repo root)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
SERVICE_API_KEY = os.getenv("SERVICE_API_KEY", "dev-service-api-key")

CAMERA_INDEX = 0        # default webcam
FACE_THRESHOLD = 0.75   # cosine similarity threshold
FRAME_SKIP = 5          # process every 5th frame

def get_auth_headers():
    """Generates an authorization header with the shared Service API Key."""
    return {"X-API-KEY": SERVICE_API_KEY}
