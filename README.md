# 🧑‍🎓 Face Recognition Attendance Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A state-of-the-art **Full-Stack Attendance Management System** leveraging **Facial Recognition** and **Liveness Detection** to automate student check-ins. Built with a high-performance FastAPI backend and a sleek, responsive React 19 + TypeScript dashboard.

---

## 🌟 Key Features

### 👨‍🏫 Admin Portal
*   **Real-time Dashboard**: Monitor student attendance with dynamic charts and live statistics.
*   **Student Management**: Add, update, and manage student profiles with face registration.
*   **History & Reports**: View detailed historical attendance logs and export reports to **CSV**.
*   **Today's View**: Instantly see who is present or absent for the current day.

### 👨‍🎓 Student Portal
*   **Attendance Statistics**: Students can track their overall attendance percentage and history.
*   **Personal Dashboard**: A simplified, secure view for students to monitor their consistency.

### 📷 Smart Attendance Service
*   **MTCNN & FaceNet**: High-accuracy face detection and embedding extraction using PyTorch.
*   **Liveness Detection**: Integrated **blink detection** to prevent spoofing attacks (photos/videos).
*   **Automatic Sync**: Seamlessly marks attendance via API calls once a match is confirmed.

---

## 🏗️ Architecture

```text
┌─────────────────────────────┐         ┌─────────────────────────────┐
│      React Frontend         │         │      FastAPI Backend        │
│  - Admin/Student Dashboards │ ◄─────► │  - JWT Authentication Guard │
│  - CSV Exports & Recharts   │         │  - SQLite parameterization  │
└─────────────────────────────┘         └──────────────┬──────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────┐         ┌─────────────────────────────┐
│    Local Camera Service     │         │       SQLite Database       │
│  - Webcam Face Detection    │ ◄─────► │  - 'students' & 'attendance'│
│  - Blink Liveness check     │         │    tables with constraints  │
└─────────────────────────────┘         └─────────────────────────────┘
```

---

## 🛠️ Tech Stack

### 💻 Frontend
*   **Framework**: React 19 (TypeScript)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Visualization**: Recharts (React 19 compatible v3)
*   **Networking**: Axios & React Router 7

### ⚙️ Backend API
*   **Framework**: FastAPI (Python 3.10+)
*   **Auth**: JWT (OAuth2) with Password Hashing (passlib/bcrypt)
*   **Database**: SQLite with parameterized queries.

### 🧠 AI / Service Layer
*   **Detection**: MTCNN (Multi-task Cascaded Convolutional Networks)
*   **Embeddings**: InceptionResnetV1 (Pre-trained on VGGFace2)
*   **Distance**: Cosine Similarity matching.

---

## 📂 Project Structure

```text
face-recognition-attendance-system/
├── backend_api/          # FastAPI main application & routers
│   ├── routers/          # auth, students, and attendance endpoints
│   └── main.py           # Application entry point
├── frontend/             # React dashboard source code
│   ├── src/              # Pages, components, services, and utils
│   └── vercel.json       # SPA client-side routing config
├── attendance_service/   # Real-time camera recognition & liveness logic
├── backend/              # Database scripts and management helpers
├── database/             # SQLite storage & database connection helpers
├── docs/                 # Documentation (Roadmap, Deployment Guide, etc.)
├── scratch/              # Integration and unit testing scripts
└── requirements.txt      # Pinned python dependency configurations
```

---

## 🚀 Local Setup & Installation

### 1️⃣ Backend API Setup
Navigate to the root directory and set up the Python environment:
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# OR: source venv/bin/activate  # Linux/macOS

# Install pinned dependencies
pip install -r requirements.txt

# Initialize the database
python backend/init_db.py

# Create a local .env file in root directory:
# JWT_SECRET_KEY=generate_your_64_character_hex_string

# Start the API server
python -m uvicorn backend_api.main:app --host 0.0.0.0 --port 8000 --reload
```
*API runs at: `http://localhost:8000`*

### 2️⃣ Frontend Dashboard Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

### 3️⃣ Attendance Camera Service
The camera service runs locally (e.g. at the classroom entrance) and communicates with the API.
```bash
# In root directory with active venv:
python attendance_service/main.py
```

---

## 🔑 REST API Endpoints & Authorization

All secure endpoints utilize **JWT Bearer Authentication**.

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/login` | Public | Logs in a student/admin and returns JWT access token. |
| **POST** | `/auth/register` | Admin Only | Registers standard users. |
| **GET** | `/auth/me` | Authenticated | Decodes token to return authenticated user status. |
| **POST** | `/students/register` | Admin Only | Registers a student profile along with face image multipart data. |
| **GET** | `/students/all` | Admin Only | Returns details of all registered students. |
| **GET** | `/students/{student_id}/embedding` | Admin Only | Extracts raw serialized facial vector for the student. |
| **GET** | `/attendance/today` | Admin Only | List of all attendance entries logged for the current calendar date. |
| **GET** | `/attendance/history` | Admin Only | Complete archive of historical attendance entries. |
| **GET** | `/attendance/student/{id}/records` | Student / Admin | Fetches attendance logs filtered to a specific student ID. |
| **POST** | `/attendance/mark` | Authenticated | Marks attendance for a student (called by the local webcam service). |

---

## 🛠️ Edge-Case Exception Handling & Robustness

1. **Duplicate Registrations**: The backend catches `sqlite3.IntegrityError` raised by duplicate `student_id` database entries, returning a clean `400 Bad Request` instead of crashing.
2. **Session Expiry Handling**: An Axios interceptor checks all client requests. If the API returns a `401 Unauthorized` (indicating the JWT token expired), the frontend automatically clears local storage and redirects the user to `/login?expired=true` showing a friendly banner.
3. **Pydantic Validation**: All endpoints enforce strict data typing using Pydantic models. Malformed parameters return standard `422 Unprocessable Entity` structures.

---

## ☁️ Cloud Deployment Configuration

See the [Detailed Deployment Guide](docs/deployment-guide.md) for full instructions.

### Backend (Railway or Render)
- **Persistent Volume**: Since SQLite is local, configure a persistent volume mounted at `/app/database` (or your database directory) so the `attendance.db` data persists across restarts.
- **Environment Variables**:
  - `JWT_SECRET_KEY`: Secure 64-char key.
  - `PYTHONPATH`: `.`
- **Start Command**: `uvicorn backend_api.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
- **Build Settings**: Vite (React), Build command: `npm run build`, Output directory: `dist`.
- **Environment Variables**:
  - `VITE_API_URL`: Your deployed Render/Railway backend URL.
- **Vercel Rewrites**: Handled dynamically in [vercel.json](frontend/vercel.json) to reroute wildcard paths to `index.html` (resolving client-side routing 404s on page refresh).

---

## 🧪 Automated Testing

We maintain a thorough test suite. To execute automated verification, run:

```bash
# Run route protection tests
python C:\Users\Admin\.gemini\antigravity\brain\248d2cbe-2c9f-43bd-86c8-ab15d4d151cf\scratch\test_route_protection.py

# Run integration and database edge case tests
python scratch/test_integration_and_edge_cases.py
```

---

## 👨‍💻 Author
**Akif Naveed**
*Software Engineering Student | AI Enthusiast*
- [LinkedIn](https://www.linkedin.com/in/akif-naveed/)
- [GitHub](https://github.com/AkifNaveed12)
- [Portfolio](https://portfolio-muhammad-akif-naveed.vercel.app/)

---
*Maintained collaboratively for academic and enhancement purposes.*