// src/app/providers.tsx
// AUTH-T1: AuthContext — single source of truth for auth state
// Token key: "token" (unchanged from Login.tsx to preserve compatibility)
import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
    token: string | null;
    studentId: string | null;
    role: string | null;
    isAuthenticated: boolean;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface Props {
    children: ReactNode;
}

export function AuthProvider({ children }: Props) {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("token")
    );
    const [studentId, setStudentId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const navigate = useNavigate();

    // Decode studentId and role from token payload (client-side, no crypto verification)
    useEffect(() => {
        if (!token) {
            setStudentId(null);
            setRole(null);
            return;
        }
        try {
            const parts = token.split(".");
            if (parts.length !== 3) throw new Error("bad token");
            const payload = JSON.parse(atob(parts[1]));
            setStudentId(payload?.sub ?? null);
            setRole(payload?.role ?? null);
        } catch {
            setStudentId(null);
            setRole(null);
        }
    }, [token]);

    // Sync token from localStorage changes (e.g. Login.tsx sets it directly)
    useEffect(() => {
        const stored = localStorage.getItem("token");
        if (stored !== token) {
            setToken(stored);
        }
    });

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setToken(null);
        setStudentId(null);
        setRole(null);
        navigate("/login", { replace: true });
    }, [navigate]);

    return (
        <AuthContext.Provider
            value={{
                token,
                studentId,
                role,
                isAuthenticated: !!token,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
