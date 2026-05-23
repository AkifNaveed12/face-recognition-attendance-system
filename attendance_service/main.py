import cv2
import time
from collections import deque, defaultdict

from config import FACE_THRESHOLD, FRAME_SKIP, CAMERA_INDEX
from face_recognizer import recognize_faces, load_students
from api_client import mark_attendance
from cache_builder import build_cache
from liveness import BlinkDetector


# ----------------------------
# Configs
# ----------------------------
ATTENDANCE_COOLDOWN = 60 * 5  # 5 minutes

VOTING_WINDOW = 10
MIN_VOTES = 6

# ATTENDANCE-T0: Camera recovery configuration
CAMERA_READ_RETRIES = 5        # consecutive failed reads before attempting reconnect
CAMERA_RETRY_DELAY = 0.5       # seconds between retry attempts
CAMERA_RECONNECT_ATTEMPTS = 3  # how many times to try reconnecting camera
CAMERA_RECONNECT_DELAY = 2.0   # seconds between reconnect attempts

# ATTENDANCE-T1: Startup resilience configuration
BACKEND_STARTUP_RETRIES = 5    # how many times to retry backend connection at startup
BACKEND_RETRY_DELAY = 3.0      # seconds between startup retry attempts


# ----------------------------
# ATTENDANCE-T0: Camera open helper with reconnect
# ----------------------------
def open_camera(index: int) -> cv2.VideoCapture:
    """Open the camera and return a VideoCapture. Raises RuntimeError if unavailable."""
    cap = cv2.VideoCapture(index)
    if not cap.isOpened():
        raise RuntimeError(f"[ERROR] Camera index {index} could not be opened.")
    print(f"[INFO] Camera opened successfully (index={index})")
    return cap


# ----------------------------
# ATTENDANCE-T1: Startup resilience — retry build_cache if backend is offline
# ----------------------------
def build_cache_with_retry() -> bool:
    """
    Attempts to build the student cache, retrying if the backend is unreachable.
    Returns True on success, False after all retries exhausted.
    """
    for attempt in range(1, BACKEND_STARTUP_RETRIES + 1):
        try:
            print(f"[INFO] Connecting to backend (attempt {attempt}/{BACKEND_STARTUP_RETRIES})...")
            build_cache()
            print("[INFO] Student cache built successfully.")
            return True
        except Exception as e:
            print(f"[WARN] Backend not reachable: {e}")
            if attempt < BACKEND_STARTUP_RETRIES:
                print(f"[INFO] Retrying in {BACKEND_RETRY_DELAY}s...")
                time.sleep(BACKEND_RETRY_DELAY)
    print("[ERROR] Could not connect to backend after all retries. Is the API server running?")
    return False


def main():
    # ATTENDANCE-T1: Retry backend connection at startup instead of crashing
    if not build_cache_with_retry():
        print("[ERROR] Attendance service cannot start — backend unavailable.")
        return

    students = load_students()
    print(f"[INFO] Loaded {len(students)} students into memory")

    if not students:
        print("[ERROR] No students found in cache. Register students first via the admin panel.")
        return

    # ATTENDANCE-T0: Use helper that validates camera opens
    try:
        cap = open_camera(CAMERA_INDEX)
    except RuntimeError as e:
        print(e)
        return

    last_seen = {}  # student_id -> timestamp
    vote_buffer = defaultdict(lambda: deque(maxlen=VOTING_WINDOW))

    blink_detector = BlinkDetector()

    frame_count = 0
    consecutive_failures = 0  # ATTENDANCE-T0: track consecutive read failures

    print("[INFO] Attendance service started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()

        # ----------------------------
        # ATTENDANCE-T0: Camera recovery logic
        # ----------------------------
        if not ret:
            consecutive_failures += 1
            print(f"[WARN] Camera read failed (attempt {consecutive_failures}/{CAMERA_READ_RETRIES})")

            if consecutive_failures < CAMERA_READ_RETRIES:
                # Short retry — may be a transient frame drop
                time.sleep(CAMERA_RETRY_DELAY)
                continue

            # Sustained failure — attempt full camera reconnect
            print("[WARN] Sustained camera failure. Attempting camera reconnect...")
            cap.release()

            reconnected = False
            for attempt in range(1, CAMERA_RECONNECT_ATTEMPTS + 1):
                print(f"[INFO] Reconnect attempt {attempt}/{CAMERA_RECONNECT_ATTEMPTS}...")
                time.sleep(CAMERA_RECONNECT_DELAY)
                try:
                    cap = open_camera(CAMERA_INDEX)
                    consecutive_failures = 0
                    reconnected = True
                    print("[INFO] Camera reconnected successfully.")
                    break
                except RuntimeError as e:
                    print(f"[WARN] {e}")

            if not reconnected:
                print("[ERROR] Camera could not be reconnected. Shutting down attendance service.")
                break

            continue  # Resume loop with fresh cap

        # Successful read — reset failure counter
        consecutive_failures = 0

        frame_count += 1
        if frame_count % FRAME_SKIP != 0:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = recognize_faces(rgb, students, FACE_THRESHOLD)

        now = time.time()

        blinked = blink_detector.process(frame)

        for r in results:
            x1, y1, x2, y2 = r["box"]
            sid = r["student_id"]
            name = r["name"]
            score = r["confidence"]

            # ----------------------------
            # Frame voting
            # ----------------------------
            vote_buffer[sid].append(True)
            votes = sum(vote_buffer[sid])

            eligible = votes >= MIN_VOTES
            cooldown_ok = now - last_seen.get(sid, 0) >= ATTENDANCE_COOLDOWN

            label = f"{name} | {score:.2f}"

            # ----------------------------
            # Attendance logic
            # ----------------------------
            if eligible and cooldown_ok:
                if blinked:
                    try:
                        success = mark_attendance(sid)
                        if success:
                            last_seen[sid] = now
                            vote_buffer[sid].clear()
                            blink_detector.blinked = False
                            print(f"[MARKED] {name} ({sid})")
                            label += " ✅"
                    except Exception as e:
                        print(f"[ERROR] Attendance API failed for {sid}: {e}")
                else:
                    label += " | Blink to confirm 👁️"

            # ----------------------------
            # Draw bounding box
            # ----------------------------
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            cv2.putText(
                frame,
                label,
                (x1, max(y1 - 10, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2,
            )

        cv2.imshow("Attendance Camera", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            print("[INFO] Exiting...")
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
