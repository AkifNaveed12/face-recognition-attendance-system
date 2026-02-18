import { Outlet, NavLink } from "react-router-dom";

export default function AdminLayout() {
return (
    <div className="flex min-h-screen bg-[#020617] text-white">
    <aside className="w-64 border-r border-gray-800 p-4">
        <h2 className="mb-6 text-xl font-semibold text-green-400">
        Admin Panel
        </h2>

        <nav className="space-y-2">
        <NavLink
            to="/admin"
            className="block rounded px-3 py-2 hover:bg-white/10"
        >
            Dashboard
        </NavLink>

        <NavLink
            to="/admin/students"
            className="block rounded px-3 py-2 hover:bg-white/10"
        >
            Students
        </NavLink>

        <NavLink
            to="/admin/attendance"
            className="block rounded px-3 py-2 hover:bg-white/10"
        >
            Attendance
        </NavLink>

        <NavLink
            to="/admin/reports"
            className="block rounded px-3 py-2 hover:bg-white/10"
        >
            Reports
        </NavLink>
        </nav>
    </aside>

    <main className="flex-1 p-6">
        <Outlet />
    </main>
    </div>
);
}
