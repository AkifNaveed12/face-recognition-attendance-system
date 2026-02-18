import cv2
import torch
import pickle
import sqlite3
import numpy as np
from datetime import datetime
from PIL import Image

from backend.database import get_connection
from facenet_pytorch import MTCNN, InceptionResnetV1

#device setup 
device = 'cuda' if torch.cuda.is_available() else 'cpu'

#load models once
mtcnn = MTCNN(keep_all=True, device=device)
facenet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

#similarity threshold
threshold = 0.6

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def load_students():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT student_id, name, embedding FROM students")
    rows = cursor.fetchall()
    conn.close()
    
    students = []
    for student_id, name, embedding in rows:
        embedding = pickle.loads(embedding)
        # FIX: ensure embedding shape is (512,)
        if embedding.ndim == 2:
            embedding = embedding[0]
        students.append((student_id, name, embedding))
    
    return students

def already_marked(student_id):
    today = datetime.now().strftime('%Y-%m-%d')
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT 1 FROM attendance WHERE student_id = ? AND date = ?",
                (student_id, today))
    exists = cursor.fetchone()
    conn.close()
    
    return exists is not None

def mark_attendance(student_id):
    now = datetime.now()
    today = now.strftime('%Y-%m-%d')
    time = now.strftime('%H:%M:%S')
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("INSERT INTO attendance (student_id, date, time) VALUES (?, ?, ?)",
                (student_id, today, time))
    conn.commit()
    conn.close()
    

def run_attendance():
    students = load_students()
    if not students:
        print("no students registered")
        return
    
    cap = cv2.VideoCapture(0)
    
    print("Webcam started. Press 'q' to quit.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil = Image.fromarray(rgb)
        
        faces = mtcnn(pil)
        
        if faces is not None:
            for face in faces:
                face = face.unsqueeze(0).to(device)
                emb = facenet(face).detach().cpu().numpy()[0]
                
                best_score = 0
                best_match = None
                
                for student_id, name, db_emb in students:
                    score = cosine_similarity(emb, db_emb)
                    if score > best_score:
                        best_score = score
                        best_match = (student_id, name)
                
                # 🔍 ALWAYS show similarity score
                cv2.putText(
                frame,
                f"Score: {best_score:.2f}",
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 255),
                2
            )
                # ✅ If recognized
                if best_score > threshold:
                    student_id, name = best_match
                    
                    #always shows name if recognized
                    cv2.putText(
                    frame,
                    f"{name} ({student_id})",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2
                )
                    # mark attendance only once per day
                    if not already_marked(student_id):
                        mark_attendance(student_id)
                        print(f"Attendance marked for {name} ({student_id})")
        cv2.imshow("Face Attendance System", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()