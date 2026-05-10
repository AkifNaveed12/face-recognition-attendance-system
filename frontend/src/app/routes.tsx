import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../routes/ProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import StudentLayout from "../layouts/StudentLayout";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminStudents from "../pages/admin/Students";
import AdminAttendance from "../pages/admin/Attendance";
import AdminReports from "../pages/admin/Reports";

import StudentDashboard from "../pages/student/Dashboard";
import StudentAttendance from "../pages/student/Attendance";

import Login from "../pages/auth/Login";

export const router = createBrowserRouter([
  { 
    path: "/", 
    element: <Navigate to="/login" replace /> 
  },
  { 
    path: "/login", 
    element: <Login /> 
  },

  // ADMIN ROUTES
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "students", element: <AdminStudents /> },
      { path: "attendance", element: <AdminAttendance /> },
      { path: "reports", element: <AdminReports /> },
    ],
  },

  // STUDENT ROUTES
  {
    path: "/student",
    element: (
      <ProtectedRoute>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: "attendance", element: <StudentAttendance /> },
    ],
  },

  // FALLBACK
  { 
    path: "*", 
    element: <Navigate to="/login" replace /> 
  },
]);