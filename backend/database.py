import sqlite3
import pickle
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.getenv("DATABASE_PATH") or os.path.join(BASE_DIR, 'database', 'attendance.db')

def  get_connection():
    # Ensure the parent directory of database exists
    db_dir = os.path.dirname(os.path.abspath(DB_PATH))
    os.makedirs(db_dir, exist_ok=True)
    return sqlite3.connect(DB_PATH)

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(""" 
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE,
        name TEXT,
        department TEXT,
        password TEXT,
        embedding BLOB
    )              
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        date TEXT,
        time TEXT
    )              
    """)
    
    conn.commit()

    # Seed default credentials if database is empty (Task 6 & 7)
    cursor.execute("SELECT COUNT(*) FROM students")
    count = cursor.fetchone()[0]
    if count == 0:
        print("[INFO] Seeding default credentials...")
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        default_users = [
            ("admin", "Admin User", "Administration", pwd_context.hash("admin123")),
            ("CS001", "Test Student - Akif", "Computer Science", pwd_context.hash("password123")),
            ("CS008", "Ahmad", "Computer Science", pwd_context.hash("AhmadCS008")),
        ]
        cursor.executemany(
            "INSERT INTO students (student_id, name, department, password) VALUES (?, ?, ?, ?)",
            default_users
        )
        conn.commit()

    conn.close()