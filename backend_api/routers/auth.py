from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import status


router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = "supersecret"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# TEMP mock storage (replace with DB later)
students = {
    "CS001": pwd_context.hash("pass123"),
    "CS002": pwd_context.hash("pass123"),
}

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

    if student_id not in students:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(password, students[student_id]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    return {
        "access_token": create_token(student_id),
        "token_type": "bearer"
    }



@router.get("/me")
def me(token: str = Depends(oauth2_scheme)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return {"student_id": payload["sub"]}
