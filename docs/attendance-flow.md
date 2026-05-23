# Attendance Flow Documentation
> Audit Date: 2026-05-23 | Read-only analysis. No changes made.

---

## Overview

There are **two separate attendance marking mechanisms** in this system:

1. **Automated AI Attendance** — `attendance_service/` (Python standalone process with webcam + face recognition + liveness detection)
2. **Manual Browser Attendance** — `pages/student/Webcam.tsx` (displays webcam, manual button, no AI)

These two flows are completely independent. They both POST to the same `/attendance/mark` endpoint.

---

## Flow 1: Automated AI Attendance Service

### Startup Sequence

```
cd attendance_service/
python main.py
    │
    ├─► build_cache()
    │   ├─► GET http://127.0.0.1:8000/students/all
    │   │   → [ { student_id, name, department }, ... ]
    │   │
    │   └─► for each student:
    │       GET http://127.0.0.1:8000/students/{id}/embedding
    │       → { student_id, name, embedding: [512 floats] }
    │
    │   └─► pickle.dump(cache, open("students_cache.pkl", "wb"))
    │
    ├─► load_students()
    │   ├─► open("students_cache.pkl", "rb")
    │   ├─► Validate each entry: must be dict, embedding shape must be (512,)
    │   └─► Returns list of (student_id, name, np.ndarray[512])
    │
    └─► Initialize:
        cap = cv2.VideoCapture(CAMERA_INDEX=0)
        blink_detector = BlinkDetector()
        vote_buffer = defaultdict(deque(maxlen=10))
        last_seen = {}
```

> ⚠️ **Risk:** If the backend is not running when `build_cache()` is called, it will raise an unhandled `requests.exceptions.ConnectionError` and crash.

---

### Per-Frame Processing Loop

```
while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Camera read failed")
        break    ← ⚠️ Loop exits permanently on any read failure
    │
    frame_count += 1
    if frame_count % FRAME_SKIP(=5) != 0:
        continue    ← Process every 5th frame only
    │
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    │
    ├─► recognize_faces(rgb, students, FACE_THRESHOLD=0.75)
    │   ├─► img = Image.fromarray(frame).convert("RGB")
    │   ├─► boxes, _ = mtcnn.detect(img)       ← raw bounding boxes
    │   ├─► faces = mtcnn(img)                 ← aligned face tensors
    │   │
    │   └─► for each face[i]:
    │       face = faces[i].unsqueeze(0)        ← [1, 3, 160, 160]
    │       emb = facenet(face).cpu().numpy()[0]  ← [512,]
    │       │
    │       └─► for each (sid, name, db_emb) in students:
    │           score = cosine_similarity(emb, db_emb)  ← scalar
    │           track best_score, best_match
    │       │
    │       if best_score >= 0.75:
    │           results.append({ student_id, name, confidence, box })
    │
    ├─► blinked = blink_detector.process(frame)
    │   ├─► MediaPipe FaceMesh on BGR frame (converted internally to RGB)
    │   ├─► Extract LEFT_EYE + RIGHT_EYE landmarks
    │   ├─► Calculate EAR (Eye Aspect Ratio) for both eyes
    │   ├─► if EAR < 0.18: blink_counter++
    │   └─► if blink_counter >= 3 frames: blinked = True
    │
    └─► for each result in results:
        vote_buffer[sid].append(True)
        votes = sum(vote_buffer[sid])           ← count of True in last 10 frames
        eligible = votes >= 6
        cooldown_ok = now - last_seen[sid] >= 300s (5 min)
        │
        if eligible AND cooldown_ok AND blinked:
            mark_attendance(sid)                ← HTTP POST
            last_seen[sid] = now
            vote_buffer[sid].clear()
            blink_detector.blinked = False
        else if eligible AND cooldown_ok AND NOT blinked:
            label += " | Blink to confirm 👁️"
        │
        Draw bounding box + label on frame
    │
    cv2.imshow("Attendance Camera", frame)
    if 'q' pressed: break
```

---

### Liveness Detection Detail

```
BlinkDetector.process(frame):
    │
    ├─► cv2.cvtColor(frame, BGR→RGB)
    ├─► mp_face_mesh.process(rgb_frame)
    │
    │   if no landmarks: reset blink_counter, return False
    │
    ├─► landmarks = results.multi_face_landmarks[0].landmark
    ├─► points = [(int(lm.x*w), int(lm.y*h)) for lm in landmarks]
    │
    ├─► left_ear  = eye_aspect_ratio(LEFT_EYE=[33,160,158,133,153,144], points)
    ├─► right_ear = eye_aspect_ratio(RIGHT_EYE=[362,385,387,263,373,380], points)
    ├─► ear = (left_ear + right_ear) / 2.0
    │
    ├─► if ear < 0.18:
    │       blink_counter++
    └─► else:
            if blink_counter >= 3:
                self.blinked = True
            blink_counter = 0
    │
    return self.blinked    ← persists until manually reset to False
```

> ⚠️ **Design note:** `blinked` is never reset to `False` on its own. It is reset only after successful attendance marking (`blink_detector.blinked = False` in `main.py`). This means if blink detection fires but face recognition fails, `blinked` remains `True` for subsequent frames — potentially allowing attendance to be marked without a fresh blink.

---

### Attendance API Call

```
attendance_service/api_client.py → mark_attendance(student_id):
    │
    ├─► requests.post(
    │       "http://127.0.0.1:8000/attendance/mark",
    │       json={"student_id": student_id},
    │       timeout=5
    │   )
    │
    ├─► if response.status == "marked": return True
    ├─► if response.status == "already_marked": return False
    └─► on RequestException: log error, return False
```

---

### Backend Attendance Mark Logic

```
POST /attendance/mark
    │
    ├─► student_id = data.get("student_id")
    │   if not student_id: raise 400
    │
    ├─► today = datetime.now().strftime("%Y-%m-%d")
    ├─► time_now = datetime.now().strftime("%H:%M:%S")
    │
    ├─► SELECT 1 FROM attendance WHERE student_id=? AND date=?
    │   if exists: return { "status": "already_marked" }
    │
    └─► INSERT INTO attendance (student_id, date, time)
        return { "status": "marked", ... }
```

---

## Flow 2: Manual Browser Attendance (Student Webcam Page)

```
Student navigates to /student → clicks Webcam (if route existed)
    │
    ├─► useEffect: navigator.mediaDevices.getUserMedia({ video: true })
    │   → streams to <video ref={videoRef} autoPlay playsInline />
    │   → No face detection, no AI, just raw camera stream display
    │
    └─► onClick "Mark Attendance":
        ├─► getMe() → GET /auth/me → { student_id }
        └─► api.post("/attendance/mark", { student_id })
            → marks attendance immediately WITHOUT any face recognition
```

> ⚠️ **Critical Design Issue:** The Webcam.tsx page is a **stub**. It bypasses all AI. Any logged-in student can mark their own attendance manually at any time. There is no route registered for this page in `app/routes.tsx` — it is currently **unreachable** via navigation. The student layout only shows Dashboard and Attendance links.

---

## Attendance Deduplication

Both flows use the same backend endpoint which has deduplication logic:

```sql
SELECT 1 FROM attendance WHERE student_id = ? AND date = ?
```

- One attendance record per student per calendar day.
- Time is stored but not used for deduplication.
- The attendance service additionally has a **5-minute cooldown** in-memory to prevent re-triggering immediately after a successful mark (even before the next day resets).

---

## Student Attendance Percentage Calculation

```python
# In attendance.py router:
present_count = COUNT(*) WHERE student_id = ?
total_classes = COUNT(DISTINCT date) FROM attendance  # ALL students, ALL dates

percentage = (present_count / total_classes) * 100
```

> ⚠️ **Semantic Issue:** `total_classes` counts all unique dates in the entire attendance table — meaning if student A was present on 10 days and student B was present on 3 different days, `total_classes = 13`. This can inflate or deflate individual student percentages depending on overall system usage.

---

## Cache Freshness Issue

```
Student registered via AddStudentModal
    │
    ├─► POST /students/register → DB updated, cache.pkl updated ✅
    │
    └─► Attendance service (already running):
        load_students() was called at startup
        students list is in-memory and STALE ❌
        New student will NOT be recognized until service restarts
```

> ⚠️ The attendance service loads student data ONCE at startup. New students registered while the service is running will not be detected until the service is restarted (`Ctrl+C` + `python main.py` again). The `students_cache.pkl` is updated by the API, but the in-memory `students` list in `main.py` is not refreshed.
