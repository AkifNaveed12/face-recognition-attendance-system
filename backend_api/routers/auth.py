from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import status


import os
from dotenv import load_dotenv

load_dotenv()  # loads .env from project root (ignored by git)

router = APIRouter(prefix="/auth", tags=["Auth"])

# AUTH-T3: Secret loaded from environment variable, not hardcoded
_raw_secret = os.getenv("JWT_SECRET_KEY")
if not _raw_secret:
    import warnings
    warnings.warn(
        "[SECURITY] JWT_SECRET_KEY not set in environment. "
        "Set it in your .env file before deploying.",
        stacklevel=2,
    )
    _raw_secret = "insecure-default-change-me"

SECRET_KEY = _raw_secret
ALGORITHM = "HS256"

from backend.database import get_connection

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(student_id: str):
    payload = {
        "sub": student_id,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    student_id = form_data.username
    password = form_data.password

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM students WHERE student_id = ?", (student_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(password, row[0]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    return {
        "access_token": create_token(student_id),
        "token_type": "bearer"
    }

@router.post("/register")
def register(student_id: str, name: str, department: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT 1 FROM students WHERE student_id = ?", (student_id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Student ID already registered")

    cursor.execute(
        "INSERT INTO students (student_id, name, department, password) VALUES (?, ?, ?, ?)",
        (student_id, name, department, pwd_context.hash(password))
    )
    conn.commit()
    conn.close()
    return {"message": "User registered successfully"}

@router.get("/me")
def me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        student_id: str = payload.get("sub")
        if student_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"student_id": student_id}
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
