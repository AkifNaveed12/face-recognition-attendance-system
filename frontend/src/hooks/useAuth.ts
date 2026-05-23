// src/hooks/useAuth.ts
// AUTH-T1: Centralized auth hook — consumes AuthContext from providers.tsx
import { useContext } from "react";
import { AuthContext } from "../app/providers";

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return ctx;
}
