# Face Attendance System — Production Deployment Guide

This guide describes how to deploy the React frontend and FastAPI backend of the Face Attendance System to cloud platforms like Vercel (frontend) and Railway/Render (backend), ensuring persistent SQLite storage and secure JWT auth.

---

## 1. System Architecture

```text
┌─────────────────────────┐               ┌─────────────────────────┐
│     Vercel Hosting      │               │     Railway / Render    │
│    (React Frontend)     │ ◄───────────► │  (FastAPI Backend API)  │
└─────────────────────────┘               └───────────┬─────────────┘
                                                      │
                                                      ▼
                                          ┌─────────────────────────┐
                                          │    Persistent Volume    │
                                          │     (attendance.db)     │
                                          └─────────────────────────┘
```

---

## 2. Backend Deployment (Railway or Render)

The backend uses FastAPI and SQLite. Since cloud containers have ephemeral disks (data is wiped on deployment or restart), you **MUST** configure a persistent volume to store `attendance.db`.

### Option A: Railway (Recommended)

1. **Create a New Project**:
   - Link your GitHub repository.
   - Choose the branch `dev/stabilization` (or `main` when finalized).

2. **Add a Volume**:
   - Go to your service settings in Railway.
   - Click **Add Volume**.
   - Mount Path: `/app/database` (This maps to the directory where `attendance.db` resides).

3. **Configure Environment Variables**:
   - Add the following variables under the **Variables** tab:
     - `JWT_SECRET_KEY`: *[Generate a secure 64-character hex string]*
     - `PORT`: `8000` (Railway automatically configures this, but you can explicitly pin it).
     - `PYTHONPATH`: `.`

4. **Build & Start Commands**:
   - Buildpack will automatically detect `requirements.txt`.
   - Start Command: `uvicorn backend_api.main:app --host 0.0.0.0 --port $PORT`

---

### Option B: Render

1. **Create Web Service**:
   - Link your GitHub repository.
   - Choose Python environment.

2. **Add Persistent Disk (Volume)**:
   - Scroll down to the **Disks** section.
   - Name: `database-disk`
   - Mount Path: `/app/database`
   - Size: `1 GB` (minimum).

3. **Environment Variables**:
   - Add `JWT_SECRET_KEY` and set your secure secret value.
   - Add `PYTHONUNBUFFERED`: `1`

4. **Build & Start Commands**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn backend_api.main:app --host 0.0.0.0 --port $PORT`

---

## 3. Frontend Deployment (Vercel)

The React frontend is built using Vite and Tailwind.

1. **Deploy to Vercel**:
   - Link your GitHub repository.
   - Select the `frontend` subfolder as the **Root Directory** of the project.

2. **Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables**:
   - Add the following environment variable:
     - `VITE_API_URL`: `https://your-backend-url.railway.app` (The URL of your deployed backend).

4. **Vite Routing Redirection** (Crucial for Client-Side Routing):
   - To prevent `404 Not Found` when refreshing protected routes (e.g. `/admin`, `/student`), add a `vercel.json` file inside the `frontend` directory:
     ```json
     {
       "rewrites": [
         { "source": "/(.*)", "destination": "/index.html" }
       ]
     }
     ```

---

## 4. Local Attendance Webcam Service

Since the attendance service requires physical access to a webcam and high-performance face recognition models, it is designed to run **locally** on a machine near the entrance (e.g. Raspberry Pi, Intel NUC, or personal PC).

1. Ensure the local system has Python 3.10+ installed.
2. Clone the repository locally.
3. Configure the local `.env` file with:
   - `JWT_SECRET_KEY`: *[Must match the backend JWT_SECRET_KEY]*
   - `BACKEND_URL`: `https://your-backend-url.railway.app` (Or `http://localhost:8000` for local dev).
4. Run `venv/Scripts/python attendance_service/main.py`.
