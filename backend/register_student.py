import cv2
import pickle
import torch
from PIL import Image
from facenet_pytorch import MTCNN, InceptionResnetV1
from backend.database import get_connection

#device setup 
device = 'cuda' if torch.cuda.is_available() else 'cpu'

#load models once
mtcnn = MTCNN(keep_all=True, device=device)
facenet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

def register_student(student_id, name, department, image_path):
    """
    Register a new student in the database by generating and storing face embeddings
    """
    
    #load image
    img = cv2.imread(image_path)
    if img is None:
        print("Image not found!")
        return
    
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(rgb)
    
    # detect face
    faces = mtcnn(pil)

    if faces is None:
        print("No face detected. Try another image.")
        return

    # take the first detected face
    face = faces[0]

    #generate embedding 
    embedding = facenet(face.unsqueeze(0).to(device))
    embedding_up = embedding.detach().cpu().numpy()
    
    #serialize embedding 
    embedding_bytes = pickle.dumps(embedding_up)
    
    #insert into database
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(""" 
        INSERT INTO students (student_id, name, department, embedding) 
        VALUES (?, ?, ?, ?);
        """, (student_id, name, department, embedding_bytes))
    
    conn.commit()
    conn.close()
    
    print("Student registered successfully!")
    
    
    