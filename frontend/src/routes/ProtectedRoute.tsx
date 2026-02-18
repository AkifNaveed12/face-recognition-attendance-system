// src/routes/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  // ✅ CHECK THE REAL TOKEN KEY
  const token =
    localStorage.getItem("access_token") || // ← MOST LIKELY
    localStorage.getItem("token");           // ← fallback

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}