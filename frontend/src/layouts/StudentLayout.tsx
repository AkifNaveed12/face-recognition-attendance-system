import { Outlet, NavLink, Navigate } from "react-router-dom";


export default function StudentLayout() {
    const token = localStorage.getItem("token");

    if (!token) {
    return <Navigate to="/login" replace />;
}
return (
    <div className="flex min-h-screen bg-[#020617] text-white">
    <aside className="w-64 border-r border-gray-800 p-4">
        <h2 className="mb-6 text-xl font-semibold text-blue-400">
        Student Panel
        </h2>

        <nav className="space-y-2">
        <NavLink
            to="/student"
            end
            className={({ isActive }) =>
            `block rounded px-3 py-2 ${
                isActive ? "bg-white/10" : "hover:bg-white/5"
            }`
            }
        >
            Dashboard
        </NavLink>

        <NavLink
            to="/student/attendance"
            className={({ isActive }) =>
            `block rounded px-3 py-2 ${
                isActive ? "bg-white/10" : "hover:bg-white/5"
            }`
            }
        >
            Attendance
        </NavLink>
        </nav>
    </aside>

    <main className="flex-1 p-6">
        <Outlet />
    </main>
    </div>
);
}
