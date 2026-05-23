// src/routes/ProtectedRoute.tsx
// AUTH-T1: Uses centralized useAuth() instead of ad-hoc localStorage reads
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

type Props = {
  children: ReactNode;
  requiredRole?: "admin" | "student";
};

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // If they have a valid session but wrong role, redirect to their proper home
    return <Navigate to={role === "admin" ? "/admin" : "/student"} replace />;
  }

  return <>{children}</>;
}