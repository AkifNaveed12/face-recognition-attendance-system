// import { createBrowserRouter, Navigate } from "react-router-dom";

// import AdminLayout from "../layouts/AdminLayout";
// import StudentLayout from "../layouts/StudentLayout";

// import AdminDashboard from "../pages/admin/Dashboard";
// import StudentsPage from "../pages/admin/Students";
// import AttendancePage from "../pages/admin/Attendance";
// import ReportsPage from "../pages/admin/Reports";

// import StudentDashboard from "../pages/student/Dashboard";
// import StudentAttendance from "../pages/student/Attendance";

// import Login from "../pages/auth/Login";

// export const router = createBrowserRouter([
//   // ✅ ROOT → LOGIN
// {
//     path: "/",
//     element: <Navigate to="/login" replace />,
// },

//   // ✅ LOGIN
// {
//     path: "/login",
//     element: <Login />,
// },

//   // ✅ STUDENT (AUTH REQUIRED INSIDE LAYOUT)
// {
//     path: "/student",
//     element: <StudentLayout />,
//     children: [
//         { index: true, element: <StudentDashboard /> },
//         { path: "attendance", element: <StudentAttendance /> },
//     ],
// },

//   // ✅ ADMIN (NO AUTH)
// {
//     path: "/admin",
//     element: <AdminLayout />,
//     children: [
//         { index: true, element: <AdminDashboard /> },
//         { path: "students", element: <StudentsPage /> },
//         { path: "attendance", element: <AttendancePage /> },
//         { path: "reports", element: <ReportsPage /> },
//     ],
// },

//   // ❌ FALLBACK
//     {
//     path: "*",
//     element: <Navigate to="/login" replace />,
//     },
// ]);

// working till student-------------------
// import { createBrowserRouter, Navigate } from "react-router-dom";

// import StudentLayout from "../layouts/StudentLayout";
// import StudentDashboard from "../pages/student/Dashboard";
// import StudentAttendance from "../pages/student/Attendance";
// import Login from "../pages/auth/Login";

// export const router = createBrowserRouter([
//   // Root → Login
//   {
//     path: "/",
//     element: <Navigate to="/login" replace />,
//   },

//   // Login
//   {
//     path: "/login",
//     element: <Login />,
//   },

//   // Student (AUTH handled inside StudentLayout)
//   {
//     path: "/student",
//     element: <StudentLayout />,
//     children: [
//       { index: true, element: <StudentDashboard /> },
//       { path: "attendance", element: <StudentAttendance /> },
//     ],
//   },

//   // Fallback
//   {
//     path: "*",
//     element: <Navigate to="/login" replace />,
//   },
// ]);


//2nd working code
// import { createBrowserRouter, Navigate } from "react-router-dom";

// // layouts
// import StudentLayout from "../layouts/StudentLayout";
// import AdminLayout from "../layouts/AdminLayout";

// // auth
// import Login from "../pages/auth/Login";

// // student pages
// import StudentDashboard from "../pages/student/Dashboard";
// import StudentAttendance from "../pages/student/Attendance";

// // admin pages
// import AdminDashboard from "../pages/admin/Dashboard";
// import AdminStudents from "../pages/admin/Students";
// import AdminAttendance from "../pages/admin/Attendance";
// import AdminReports from "../pages/admin/Reports";

// export const router = createBrowserRouter([
//   // =======================
//   // ROOT → LOGIN
//   // =======================
//   {
//     path: "/",
//     element: <Navigate to="/login" replace />,
//   },

//   // =======================
//   // LOGIN
//   // =======================
//   {
//     path: "/login",
//     element: <Login />,
//   },

//   // =======================
//   // STUDENT (AUTH INSIDE StudentLayout)
//   // =======================
//   {
//     path: "/student",
//     element: <StudentLayout />,
//     children: [
//       { index: true, element: <StudentDashboard /> },
//       { path: "attendance", element: <StudentAttendance /> },
//     ],
//   },

//   // =======================
//   // ADMIN (NO AUTH)
//   // =======================
//   {
//     path: "/admin",
//     element: <AdminLayout />,
//     children: [
//       { index: true, element: <AdminDashboard /> },
//       { path: "students", element: <AdminStudents /> },
//       { path: "attendance", element: <AdminAttendance /> },
//       { path: "reports", element: <AdminReports /> },
//     ],
//   },

//   // =======================
//   // FALLBACK
//   // =======================
//   {
//     path: "*",
//     element: <Navigate to="/login" replace />,
//   },
// ]);

//3rd working code
// import { createBrowserRouter, Navigate } from "react-router-dom";

// import AdminLayout from "../layouts/AdminLayout";
// import StudentLayout from "../layouts/StudentLayout";

// import AdminDashboard from "../pages/admin/Dashboard";
// import StudentDashboard from "../pages/student/Dashboard";
// import Login from "../pages/auth/Login";

// export const router = createBrowserRouter([
//   { path: "/", element: <Navigate to="/login" replace /> },

//   { path: "/login", element: <Login /> },

//   {
//     path: "/admin",
//     element: <AdminLayout />,
//     children: [{ index: true, element: <AdminDashboard /> }],
//   },

//   {
//     path: "/student",
//     element: <StudentLayout />,
//     children: [{ index: true, element: <StudentDashboard /> }],
//   },

//   { path: "*", element: <Navigate to="/login" replace /> },
// ]);

// import { createBrowserRouter, Navigate } from "react-router-dom";

// import AdminLayout from "../layouts/AdminLayout";
// import StudentLayout from "../layouts/StudentLayout";

// import AdminDashboard from "../pages/admin/Dashboard";
// import AdminStudents from "../pages/admin/Students";
// import AdminAttendance from "../pages/admin/Attendance";
// import AdminReports from "../pages/admin/Reports";

// import StudentDashboard from "../pages/student/Dashboard";
// import StudentAttendance from "../pages/student/Attendance";

// import Login from "../pages/auth/Login";

// export const router = createBrowserRouter([
//   { path: "/", element: <Navigate to="/login" replace /> },

//   { path: "/login", element: <Login /> },

//   // ================= ADMIN =================
//   {
//     path: "/admin",
//     element: <AdminLayout />,
//     children: [
//       { index: true, element: <AdminDashboard /> },
//       { path: "students", element: <AdminStudents /> },
//       { path: "attendance", element: <AdminAttendance /> },
//       { path: "reports", element: <AdminReports /> },
//     ],
//   },

//   // ================= STUDENT =================
//   {
//     path: "/student",
//     element: <StudentLayout />,
//     children: [
//       { index: true, element: <StudentDashboard /> },
//       { path: "attendance", element: <StudentAttendance /> },
//     ],
//   },

//   { path: "*", element: <Navigate to="/login" replace /> },
// ]);
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
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <Login /> },

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

  { path: "*", element: <Navigate to="/login" replace /> },
]);