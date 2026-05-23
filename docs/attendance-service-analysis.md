# Attendance Service Analysis
> Audit Date: 2026-05-23 | Read-only analysis. No changes made.

---

## Overview

The attendance service is an **independent Python process** that:
1. Fetches student embeddings from the backend API and caches them locally
2. Opens a webcam using OpenCV
3. Detects faces using MTCNN
4. Generates face embeddings using FaceNet (InceptionResnetV1)
5. Matches against stored embeddings using cosine similarity
6. Requires blink detection (MediaPipe) as a liveness gate
7. Calls the backend API to mark attendance when all conditions pass

---

## Files

| File | Responsibility | Status |
|------|---------------|--------|
| `config.py` | Constants: CAMERA_INDEX, FACE_THRESHOLD, FRAME_SKIP | ✅ |
| `main.py` | Entry point: webcam loop, voting, liveness, API call | ✅ Working |
| `face_recognizer.py` | MTCNN + FaceNet pipeline + cosine matching | ✅ Working |
| `liveness.py` | MediaPipe blink detection via EAR | ✅ Working |
| `api_client.py` | HTTP POST to `/attendance/mark` | ✅ Working |
| `cache_builder.py` | Fetches embeddings from API → pkl | ✅ Working |
| `students_cache.pkl` | Serialized face embedding cache | ✅ Present (27KB) |
| `requirements.txt` | Dependencies | ❌ Empty |

---

## Configuration (`config.py`)

```python
BACKEND_URL = "http://127.0.0.1:8000"   # Not imported/used anywhere
CAMERA_INDEX = 0                          # Default webcam
FACE_THRESHOLD = 0.75                     # Cosine similarity minimum
FRAME_SKIP = 5                            # Process every 5th frame
```

**Issue:** `BACKEND_URL` is defined in `config.py` but the `api_client.py` and `cache_builder.py` independently hardcode their own `API_BASE = "http://127.0.0.1:8000"`. The config value is never imported or used. Changing the backend URL requires updating 3 files.

---

## Import Structure

All imports in `main.py` are bare (no package prefix):
```python
from config import FACE_THRESHOLD, FRAME_SKIP, CAMERA_INDEX
from face_recognizer import recognize_faces, load_students
from api_client import mark_attendance
from cache_builder import build_cache
from liveness import BlinkDetector
```

**This only works when run from inside `attendance_service/`:**
```bash
cd attendance_service
python main.py        # ✅ Works
python attendance_service/main.py  # ❌ ModuleNotFoundError
```

---

## AI Pipeline

### Model Loading (`face_recognizer.py`)
```python
device = "cuda" if torch.cuda.is_available() else "cpu"

mtcnn = MTCNN(image_size=160, margin=20, keep_all=True, device=device)
facenet = InceptionResnetV1(pretrained="vggface2").eval().to(device)
```

- Models loaded at **module import time**
- `keep_all=True` — detects all faces in frame, not just the largest
- `image_size=160` — FaceNet's expected input size
- `margin=20` — adds 20px padding around detected face
- `pretrained="vggface2"` — InceptionResnetV1 pretrained weights
- `torch.no_grad()` used during inference — correct, saves memory

### Detection Step
```python
boxes, _ = mtcnn.detect(img)    # raw bounding boxes, no crop
faces = mtcnn(img)              # aligned, normalized face tensors
```

Two calls to MTCNN per frame: one for boxes, one for crops. This is slightly redundant but clean.

### Embedding Step
```python
face = faces[i].unsqueeze(0)               # [1, 3, 160, 160]
emb = facenet(face).cpu().numpy()[0]       # [512,]
```

- `unsqueeze(0)` adds batch dimension — correctly fixed (noted in `codeBugsAndSol.txt`)
- Output: 512-dimensional L2-normalized embedding vector

### Matching Step
```python
score = cosine_similarity(
    emb.reshape(1, -1),
    db_emb.reshape(1, -1)
)[0][0]
```

- Uses `sklearn.metrics.pairwise.cosine_similarity`
- Returns scalar in range [-1, 1]
- Threshold: `0.75` (set in `config.py`)
- Only the best-scoring match above threshold is returned
- **No "unknown" label** for faces below threshold — they are simply ignored

---

## Liveness Detection (`liveness.py`)

### MediaPipe FaceMesh
```python
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
```

- `max_num_faces=1` — only tracks one face
- `refine_landmarks=True` — higher quality eye landmark points

### Eye Aspect Ratio (EAR)
```
Vertical distances: p1-p2, p3-p4
Horizontal distance: p5-p6
EAR = (vertical1 + vertical2) / (2 * horizontal)
```

- When eyes are open: EAR ≈ 0.25–0.35
- When eyes are closed (blink): EAR < 0.18 (threshold)
- Blink confirmed after 3 consecutive low-EAR frames

### State Machine
```
blink_counter = 0, blinked = False

EAR < 0.18: blink_counter++
EAR >= 0.18:
    if blink_counter >= 3: blinked = True
    blink_counter = 0

blinked reset only on: successful attendance mark
```

**Risk:** `blinked` persists across frames after being set to `True`. Once a blink is detected, `blinked = True` remains until attendance is successfully marked. If the API call fails, the blink flag stays True indefinitely for that session — weakening the liveness gate.

**Risk:** `max_num_faces=1` — if two people stand in front of the camera, only one face is used for blink detection, but both might be detected by MTCNN for recognition. Mismatched face is possible.

---

## Frame Voting System (`main.py`)

```python
VOTING_WINDOW = 10    # Keep last 10 frames
MIN_VOTES = 6         # Need 6 positives out of 10

vote_buffer[sid].append(True)
votes = sum(vote_buffer[sid])
eligible = votes >= MIN_VOTES
```

- A student must be recognized in at least 6 of the last 10 processed frames
- Prevents single-frame false positives
- `deque(maxlen=10)` automatically drops oldest entry
- Vote buffer cleared after successful mark
- **Issue:** Only `True` is ever appended. `False` is never appended for non-recognitions. This means if a student is recognized in frame 1 and then leaves, `vote_buffer` retains 6+ True votes indefinitely (up to the 10-frame window). When they return, they might already be above the threshold without fresh recognition.

---

## Cooldown System

```python
ATTENDANCE_COOLDOWN = 60 * 5  # 300 seconds = 5 minutes

last_seen = {}  # student_id -> timestamp

cooldown_ok = now - last_seen.get(sid, 0) >= ATTENDANCE_COOLDOWN
```

- In-memory per student — resets on service restart
- Works alongside backend deduplication (backend prevents marking twice per day)
- Prevents the webcam loop from spamming the API for the same student

---

## Cache System (`cache_builder.py`)

```python
def build_cache():
    students = requests.get(f"{API_BASE}/students/all").json()
    cache = []
    for s in students:
        res = requests.get(f"{API_BASE}/students/{s['student_id']}/embedding")
        data = res.json()
        cache.append({
            "student_id": data["student_id"],
            "name": data["name"],
            "embedding": data["embedding"]   # list of 512 floats
        })
    with open(CACHE_PATH, "wb") as f:
        pickle.dump(cache, f)
```

**Risks:**
1. No error handling — if any student's embedding fetch fails, the entire cache build crashes
2. If backend is unreachable, `requests.get(...)` raises `ConnectionError` — unhandled
3. If a student has NULL embedding (Bug #11), `pickle.loads` in backend crashes before returning
4. Cache is a flat list — O(n) search per frame for every recognized face
5. Cache is rebuilt only at startup — new students won't appear until restart

---

## Error Handling Summary

| Scenario | Behavior |
|----------|----------|
| Backend offline at startup | Unhandled `ConnectionError` crash |
| Camera not found | `cap = cv2.VideoCapture(0)` opens with `ret=False` on first read → loop breaks |
| Camera read failure mid-run | `break` — loop exits permanently |
| No students in cache | `print("[ERROR] No students found.")` + `return` — service exits |
| Face not recognized | Silently skipped — no UI feedback |
| API mark call fails | `print("[ERROR] ...")` + service continues |
| Already marked | `api_client.py` returns False — no error shown |

---

## Performance Characteristics

| Factor | Value | Impact |
|--------|-------|--------|
| Frame skip | Every 5th frame | Reduces CPU load by 80% |
| MTCNN calls | 2 per processed frame (detect + crop) | Moderate cost |
| FaceNet inference | 1 per face per processed frame | Most expensive step |
| O(n) student matching | Linear scan of all students | Fine for <1000 students |
| All models on CPU | Default if no CUDA GPU | Slower inference |
| MediaPipe FaceMesh | 1 call per processed frame | Lightweight |

---

## Dependency Requirements (Inferred)

The `requirements.txt` is empty. Based on code analysis, these are required:

```
opencv-python
torch
torchvision
facenet-pytorch
mediapipe
scikit-learn
Pillow
requests
numpy
```

---

## AI Pipeline Issues

| Issue | Description | Severity |
|-------|-------------|----------|
| Models load at import | ~3-5s startup delay | 🟢 Low |
| Single embedding per student | Registration uses 1 photo; real-world lighting variance may cause misses | 🟡 Medium |
| EAR threshold hardcoded | `0.18` may not work for all users | 🟡 Medium |
| Vote buffer never gets False | Old True votes persist in buffer | 🟡 Medium |
| blinked not reset on failed mark | Liveness gate weakened | 🟢 Low |
| Cache stale on new student | Must restart service | 🟡 Medium |
| No CUDA check feedback | Falls back to CPU silently | 🟢 Low |
| MTCNN called twice per frame | Slightly redundant | 🟢 Low |
