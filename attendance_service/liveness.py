import mediapipe as mp
import numpy as np
import cv2
from math import dist

mp_face_mesh = mp.solutions.face_mesh

# Eye landmark indices (MediaPipe standard)
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

EYE_AR_THRESHOLD = 0.18
BLINK_CONSEC_FRAMES = 3


def eye_aspect_ratio(eye_points, landmarks):
    p1 = landmarks[eye_points[1]]
    p2 = landmarks[eye_points[5]]
    p3 = landmarks[eye_points[2]]
    p4 = landmarks[eye_points[4]]
    p5 = landmarks[eye_points[0]]
    p6 = landmarks[eye_points[3]]

    vertical1 = dist(p1, p2)
    vertical2 = dist(p3, p4)
    horizontal = dist(p5, p6)

    return (vertical1 + vertical2) / (2.0 * horizontal)


class BlinkDetector:
    def __init__(self):
        self.face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.blink_counter = 0
        self.blinked = False

    def process(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            self.blink_counter = 0
            return False

        landmarks = results.multi_face_landmarks[0].landmark
        h, w, _ = frame.shape

        points = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]

        left_ear = eye_aspect_ratio(LEFT_EYE, points)
        right_ear = eye_aspect_ratio(RIGHT_EYE, points)

        ear = (left_ear + right_ear) / 2.0

        if ear < EYE_AR_THRESHOLD:
            self.blink_counter += 1
        else:
            if self.blink_counter >= BLINK_CONSEC_FRAMES:
                self.blinked = True
            self.blink_counter = 0

        return self.blinked
