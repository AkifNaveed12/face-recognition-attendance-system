# Face Recognition Based Attendance Management System

A full-stack Face Recognition based Attendance Management System designed to automate student attendance using facial recognition technology.

## 🚀 Project Overview

This system allows:

- 👨‍🏫 Admin to manage students, attendance, and reports
- 👨‍🎓 Students to view attendance statistics
- 📷 Live face recognition-based attendance marking
- 📊 Real-time attendance dashboard
- 📁 CSV export functionality
- 🔐 JWT-based authentication

---

## 🏗️ Tech Stack

### Backend
- FastAPI
- Python
- SQLite
- JWT Authentication
- Face Recognition Model

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

---

## 📂 Project Structure
face-attendance-system/
│
├── backend_api/ # FastAPI backend
├── frontend/ # React frontend
├── database/ # Database files
├── models/ # ML models
├── attendance_service/ # Recognition logic
└── README.md

---

## ⚙️ Setup Instructions

### 1️⃣ Backend Setup

```bash
cd Users\Admin\OneDrive\Desktop\face-attendance-system
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend_api.main:app --reload
Backend runs on:

http://localhost:8000


2️⃣ Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs on:

http://localhost:5173

🔐 Authentication

The system uses JWT tokens for secure authentication between frontend and backend.

📈 Features

Admin Dashboard

Student Dashboard

Attendance History

Today's Attendance View

CSV Export

Real-time auto refresh

Role-based routing protection

🤝 Collaboration

This repository is maintained collaboratively for academic and enhancement purposes.

📌 Future Improvements

Real-time WebSocket updates

Deployment (Docker)

Cloud storage integration

Improved face model accuracy

Analytics dashboard

👨‍💻 Author

Akif Naveed
Software Engineering Student
AI & Full Stack Enthusiast