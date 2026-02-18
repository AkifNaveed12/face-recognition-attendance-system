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


def main():
    print("[INFO] Building students cache...")
    build_cache()

    students = load_students()
    print(f"[INFO] Loaded {len(students)} students into memory")

    if not students:
        print("[ERROR] No students found.")
        return

    cap = cv2.VideoCapture(CAMERA_INDEX)

    last_seen = {}  # student_id -> timestamp
    vote_buffer = defaultdict(lambda: deque(maxlen=VOTING_WINDOW))

    blink_detector = BlinkDetector()

    frame_count = 0
    print("[INFO] Attendance service started")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] Camera read failed")
            break

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
