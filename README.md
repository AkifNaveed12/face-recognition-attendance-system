<div align="center">

# 🧑‍🎓 Face Recognition Attendance Management System

### 🚀 AI-Powered Smart Attendance Platform using Face Recognition & Liveness Detection

<p align="center">
  <a href="https://fastapi.tiangolo.com/">
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" />
  </a>

<a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  </a>

<a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  </a>

<a href="https://pytorch.org/">
    <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
  </a>

<a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  </a>

<a href="https://vercel.com/">
    <img src="https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel" />
  </a>

<a href="https://render.com/">
    <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" />
  </a>
</p>

---

### 🌐 Live Deployment

🚀 **Frontend:**
https://face-recognition-attendance-system-jet.vercel.app/login

⚙️ **Backend API:**
https://face-recognition-attendance-system-il2q.onrender.com

📦 **GitHub Repository:**
https://github.com/AkifNaveed12/face-recognition-attendance-system

</div>

---

# 📌 Project Overview

The **Face Recognition Attendance Management System** is a modern full-stack AI-powered web application designed to automate classroom attendance through:

- 🧠 Real-time Facial Recognition
- 👁️ Blink-based Liveness Detection
- 🔐 JWT Authentication
- 📊 Smart Admin & Student Dashboards
- ☁️ Cloud Deployment Infrastructure
- 📷 Webcam-based Attendance Monitoring

The platform eliminates manual attendance processes, reduces proxy attendance fraud, and provides real-time attendance analytics through a secure and responsive web interface.

---

# ✨ Features

---

## 👨‍🏫 Admin Portal

### ✅ Dashboard Analytics

- Real-time attendance monitoring
- Attendance charts & statistics
- Daily attendance insights
- Student attendance tracking

### ✅ Student Management

- Register students with facial embeddings
- Manage student profiles
- Attendance history access
- CSV report exporting

### ✅ Security

- JWT-based authentication
- Role-protected routes
- Secure API authorization

---

## 👨‍🎓 Student Portal

- Personal attendance dashboard
- Attendance percentage tracking
- Attendance history records
- Secure student authentication

---

## 🤖 AI Attendance Engine

### 🧠 AI Recognition Pipeline

- Face Detection using **MTCNN**
- Face Embeddings using **FaceNet**
- Cosine Similarity Matching

### 👁️ Liveness Detection

- Blink detection
- Spoof prevention
- Fake photo/video detection

### ⚡ Real-Time Attendance

- Automatic attendance marking
- Backend synchronization
- Live recognition pipeline

---

# 🏗️ System Architecture

```text
┌──────────────────────────────┐
│        React Frontend        │
│ ──────────────────────────── │
│ • Admin Dashboard            │
│ • Student Dashboard          │
│ • Attendance Charts          │
│ • JWT Authentication         │
└──────────────┬───────────────┘
               │ HTTPS REST API
               ▼
┌──────────────────────────────┐
│        FastAPI Backend       │
│ ──────────────────────────── │
│ • JWT Validation             │
│ • Attendance APIs            │
│ • Student Management         │
│ • Embedding Storage          │
│ • Role Authorization         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Attendance AI Service    │
│ ──────────────────────────── │
│ • Webcam Stream              │
│ • Face Detection             │
│ • Face Recognition           │
│ • Blink Verification         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        SQLite Database       │
│ ──────────────────────────── │
│ • Students                   │
│ • Attendance Records         │
│ • Face Embeddings            │
└──────────────────────────────┘
```

---

# 🧠 AI Models & Recognition Pipeline

| Component          | Technology                  |
| ------------------ | --------------------------- |
| Face Detection     | MTCNN                       |
| Face Embeddings    | FaceNet / InceptionResnetV1 |
| Embedding Dataset  | VGGFace2                    |
| Face Matching      | Cosine Similarity           |
| Liveness Detection | Eye Aspect Ratio (EAR)      |

---

# 🛠️ Tech Stack

---

## 💻 Frontend

| Technology   | Purpose            |
| ------------ | ------------------ |
| React 19     | Frontend Framework |
| TypeScript   | Type Safety        |
| Vite         | Build Tool         |
| Tailwind CSS | UI Styling         |
| Axios        | API Communication  |
| React Router | Routing            |
| Recharts     | Analytics & Graphs |

---

## ⚙️ Backend

| Technology     | Purpose          |
| -------------- | ---------------- |
| FastAPI        | Backend API      |
| JWT            | Authentication   |
| Pydantic       | Validation       |
| SQLite         | Database         |
| Passlib/Bcrypt | Password Hashing |

---

## 🤖 AI / Computer Vision

| Technology | Purpose                   |
| ---------- | ------------------------- |
| PyTorch    | Deep Learning             |
| OpenCV     | Webcam Processing         |
| MediaPipe  | Facial Landmark Detection |
| MTCNN      | Face Detection            |
| FaceNet    | Embedding Extraction      |

---

## ☁️ Deployment & DevOps

| Service               | Purpose                  |
| --------------------- | ------------------------ |
| Vercel                | Frontend Hosting         |
| Render                | Backend Hosting          |
| GitHub                | Version Control          |
| Environment Variables | Secure Config Management |

---

# 📂 Project Structure

```text
face-recognition-attendance-system/
│
├── backend_api/
│   ├── routers/
│   ├── middleware/
│   ├── models/
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   ├── public/
│   ├── vercel.json
│   └── vite.config.ts
│
├── attendance_service/
│   ├── recognition/
│   ├── liveness/
│   └── main.py
│
├── backend/
├── database/
├── docs/
├── scratch/
├── requirements.txt
├── .python-version
└── README.md
```

---

# 🔐 Authentication & Security

✅ JWT Bearer Authentication
✅ Password Hashing with bcrypt
✅ Protected API Routes
✅ Role-Based Authorization
✅ Production-safe CORS Configuration
✅ Environment-based Secret Management
✅ Internal Service API Key Validation

---

# 📡 REST API Endpoints

| Method | Endpoint              | Description                |
| ------ | --------------------- | -------------------------- |
| POST   | `/auth/login`         | User login                 |
| POST   | `/auth/register`      | Register user              |
| GET    | `/auth/me`            | Current authenticated user |
| POST   | `/students/register`  | Register student           |
| GET    | `/students/all`       | Get all students           |
| GET    | `/attendance/today`   | Today's attendance         |
| GET    | `/attendance/history` | Full attendance history    |
| POST   | `/attendance/mark`    | Mark attendance            |

---

# 🚀 Production Deployment

---

## ⚙️ Backend Deployment — Render

### Environment Variables

```env
JWT_SECRET_KEY=your_secret_key
SERVICE_API_KEY=your_service_key
FRONTEND_URL=https://face-recognition-attendance-system-jet.vercel.app
PYTHONPATH=.
```

### Start Command

```bash
uvicorn backend_api.main:app --host 0.0.0.0 --port $PORT
```

---

## 💻 Frontend Deployment — Vercel

### Environment Variables

```env
VITE_API_URL=https://face-recognition-attendance-system-il2q.onrender.com
```

### Build Configuration

```bash
npm run build
```

### Output Directory

```text
dist
```

---

# ⚙️ Local Development Setup

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/AkifNaveed12/face-recognition-attendance-system.git

cd face-recognition-attendance-system
```

---

## 2️⃣ Backend Setup

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend
uvicorn backend_api.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## 4️⃣ Attendance Service

```bash
python attendance_service/main.py
```

---

# 🧪 Major Production Challenges Solved

✅ MediaPipe Python Compatibility Issues
✅ Vercel SPA Client-Side Routing
✅ Production CORS Configuration
✅ Environment-based API Configuration
✅ Render Deployment Runtime Issues
✅ Strict TypeScript Production Build Errors
✅ Secure JWT & Service API Key Handling

---

# 📈 Key Highlights

- 🚀 Full-stack AI application
- 🧠 Real-time face recognition
- ☁️ Production cloud deployment
- 🔐 JWT-secured architecture
- 📊 Responsive admin dashboards
- 👁️ Liveness detection integration
- ⚡ Real-world deployment debugging
- 🏗️ Distributed edge-AI architecture

---

# 🔮 Future Improvements

- PostgreSQL Migration
- Docker Containerization
- Redis Caching
- Multi-Camera Support
- Mobile Application
- Attendance Notifications
- Kubernetes Deployment
- Advanced Anti-Spoofing

---

# 👨‍💻 Author

<div align="center">

## Muhammad Akif Naveed

### Software Engineering Student • AI Enthusiast • Full-Stack Developer

<p align="center">
  <a href="https://github.com/AkifNaveed12">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github" />
  </a>

<a href="https://www.linkedin.com/in/akif-naveed/">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin" />
  </a>

<a href="https://portfolio-muhammad-akif-naveed.vercel.app/">
    <img src="https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel" />
  </a>
</p>

</div>

---

<div align="center">

# ⭐ Project Status

✅ Production Ready
✅ Frontend Deployed
✅ Backend Deployed
✅ AI Recognition Integrated
✅ JWT Authentication Working
✅ Cloud Hosted
✅ Portfolio Ready

---

### 🚀 Built with AI, Full-Stack Engineering & Computer Vision

</div>
