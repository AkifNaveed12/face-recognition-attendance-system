// import { useEffect, useState } from "react";
// import { getAllStudents } from "../../services/students";
// import { getTodayAttendance } from "../../services/attendance.service";
// import type { TodayAttendance } from "../../services/attendance.service";
// import {
//     PieChart,
//     Pie,
//     Cell,
//     ResponsiveContainer,
//     BarChart,
//     Bar,
//     XAxis,
//     Tooltip
// } from "recharts";

// export default function AdminDashboard() {
//     const [totalStudents, setTotalStudents] = useState(0);
//     const [attendance, setAttendance] = useState<TodayAttendance | null>(null);
//     const [loading, setLoading] = useState(true);

//     async function loadData() {
//         try {
//             const [students, today] = await Promise.all([
//                 getAllStudents(),
//                 getTodayAttendance()
//             ]);

//             setTotalStudents(students.length);
//             setAttendance(today);
//         } catch (err) {
//             console.error("Dashboard load failed", err);
//         } finally {
//             setLoading(false);
//         }
//     }

//     useEffect(() => {
//         loadData();

//         const interval = setInterval(loadData, 5000); // auto refresh
//         return () => clearInterval(interval);
//     }, []);

//     if (loading || !attendance) {
//         return <p className="text-gray-400">Loading dashboard...</p>;
//     }

//     const present = attendance.total_present;
//     const absent = totalStudents - present;

//     /* ===== CHART DATA (ADDED) ===== */
//     const pieData = [
//         { name: "Present", value: present },
//         { name: "Absent", value: absent }
//     ];

//     const COLORS = ["#22c55e", "#ef4444"];

//     return (
//         <div className="space-y-6">
//             <h1 className="text-2xl font-semibold">Dashboard Overview</h1>

//             {/* ===== STAT CARDS ===== */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <StatCard
//                     title="Total Students"
//                     value={totalStudents}
//                     color="text-green-400"
//                 />

//                 <StatCard
//                     title="Today Present"
//                     value={present}
//                     color="text-green-400"
//                 />

//                 <StatCard
//                     title="Absent"
//                     value={absent}
//                     color="text-red-400"
//                 />
//             </div>

//             {/* ===== CHARTS (ADDED BELOW CARDS) ===== */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* PIE CHART */}
//                 <div className="rounded-xl border border-gray-800 bg-[#020617] p-6">
//                     <h2 className="mb-4 text-lg font-semibold">
//                         Attendance Distribution
//                     </h2>

//                     <div className="h-64">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                     data={pieData}
//                                     dataKey="value"
//                                     nameKey="name"
//                                     outerRadius={90}
//                                     label
//                                 >
//                                     {pieData.map((_, index) => (
//                                         <Cell
//                                             key={index}
//                                             fill={COLORS[index]}
//                                         />
//                                     ))}
//                                 </Pie>
//                             </PieChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//                 {/* BAR CHART */}
//                 <div className="rounded-xl border border-gray-800 bg-[#020617] p-6">
//                     <h2 className="mb-4 text-lg font-semibold">
//                         Today Summary
//                     </h2>

//                     <div className="h-64">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <BarChart
//                                 data={[
//                                     { name: "Present", value: present },
//                                     { name: "Absent", value: absent }
//                                 ]}
//                             >
//                                 <XAxis dataKey="name" />
//                                 <Tooltip />
//                                 <Bar dataKey="value" fill="#22c55e" />
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// function StatCard({
//     title,
//     value,
//     color
// }: {
//     title: string;
//     value: number;
//     color: string;
// }) {
//     return (
//         <div className="rounded-xl border border-gray-800 bg-[#020617] p-6">
//             <p className="text-gray-400">{title}</p>
//             <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
//         </div>
//     );
// }

import { useEffect, useState } from "react";
import api from "../../services/api";
import { getAllStudents } from "../../services/students";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
} from "recharts";

/* ✅ LOCAL TYPE — backend returns this shape */
type TodayAttendance = {
    total_present: number;
};

export default function AdminDashboard() {
    const [totalStudents, setTotalStudents] = useState(0);
    const [attendance, setAttendance] = useState<TodayAttendance>({
    total_present: 0,
});
const [loading, setLoading] = useState(true);

useEffect(() => {
    async function load() {
        try {
        // students
        const students = await getAllStudents(); // ✅ ARRAY
        setTotalStudents(students.length);

        // today attendance
        const res = await api.get("/attendance/today");
        setAttendance(res.data);
    } catch (err) {
        console.error("Admin dashboard load failed", err);
        setTotalStudents(0);
        setAttendance({ total_present: 0 });
    } finally {
        setLoading(false);
    }
    }

    load();
}, []);

if (loading) {
    return <p className="text-gray-400">Loading dashboard...</p>;
}

    const present = attendance.total_present;
    const absent = Math.max(totalStudents - present, 0);

const chartData = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
    ];

const COLORS = ["#22c55e", "#ef4444"];

return (
    <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard Overview</h1>

      {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={totalStudents} color="text-green-400" />
        <StatCard title="Today Present" value={present} color="text-green-400" />
        <StatCard title="Absent" value={absent} color="text-red-400" />
    </div>

      {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PIE */}
        <div className="rounded-xl border border-gray-800 bg-[#020617] p-6">
            <h2 className="mb-4 text-lg font-semibold">Attendance Distribution</h2>
            <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie data={chartData} dataKey="value" outerRadius={90} label>
                    {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                ))}
                </Pie>
            </PieChart>
            </ResponsiveContainer>
        </div>
        </div>

        {/* BAR */}
        <div className="rounded-xl border border-gray-800 bg-[#020617] p-6">
            <h2 className="mb-4 text-lg font-semibold">Today Summary</h2>
            <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" />
            </BarChart>
            </ResponsiveContainer>
        </div>
        </div>
    </div>
    </div>
);
}

function StatCard({
    title,
    value,
    color,
}: {
    title: string;
    value: number;
    color: string;
}) {
return (
    <div className="rounded-xl border border-gray-800 bg-[#020617] p-6">
        <p className="text-gray-400">{title}</p>
        <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
);
}