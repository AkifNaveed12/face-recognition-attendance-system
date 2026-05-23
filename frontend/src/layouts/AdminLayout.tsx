// src/layouts/AdminLayout.tsx
// AUTH-T1: Added logout button using useAuth(). Layout structure unchanged.
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminLayout() {
    const { logout, studentId } = useAuth();

    return (
        <div className="flex min-h-screen bg-[#020617] text-white">
            <aside className="w-64 border-r border-gray-800 p-4 flex flex-col">
                <h2 className="mb-6 text-xl font-semibold text-green-400">
                    Admin Panel
                </h2>

                <nav className="space-y-2 flex-1">
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) =>
                            `block rounded px-3 py-2 ${isActive ? "bg-white/10" : "hover:bg-white/10"}`
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/admin/students"
                        className={({ isActive }) =>
                            `block rounded px-3 py-2 ${isActive ? "bg-white/10" : "hover:bg-white/10"}`
                        }
                    >
                        Students
                    </NavLink>

                    <NavLink
                        to="/admin/attendance"
                        className={({ isActive }) =>
                            `block rounded px-3 py-2 ${isActive ? "bg-white/10" : "hover:bg-white/10"}`
                        }
                    >
                        Attendance
                    </NavLink>

                    <NavLink
                        to="/admin/reports"
                        className={({ isActive }) =>
                            `block rounded px-3 py-2 ${isActive ? "bg-white/10" : "hover:bg-white/10"}`
                        }
                    >
                        Reports
                    </NavLink>
                </nav>

                {/* Logout section */}
                <div className="mt-auto pt-4 border-t border-gray-800">
                    {studentId && (
                        <p className="text-xs text-gray-500 mb-2 truncate">
                            Logged in: {studentId}
                        </p>
                    )}
                    <button
                        onClick={logout}
                        className="w-full rounded px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 text-left transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-6">
                <Outlet />
            </main>
        </div>
    );
}
