// import { useEffect, useState } from "react";
// import { getStudentAttendanceStats } from "../../services/attendance.service";
// import {
//     PieChart,
//     Pie,
//     Cell,
//     ResponsiveContainer,
//     Tooltip,
// } from "recharts";
// import { getMe } from "../../services/auth.service";

// export default function StudentDashboard() {
//     const [presentCount, setPresentCount] = useState(0);
//     const [totalClasses, setTotalClasses] = useState(0);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         async function load() {
//             try {
//                 const me = await getMe();
//                 const stats = await getStudentAttendanceStats(me.student_id);

//                 setPresentCount(stats.present);
//                 setTotalClasses(stats.total_classes);
//             } catch (err) {
//                 console.error("Dashboard load failed", err);
//             } finally {
//                 setLoading(false);
//             }
//         }

//         load();
//     }, []);

//     if (loading) {
//         return <p className="text-gray-400">Loading dashboard...</p>;
//     }

//     const chartData = [
//         { name: "Present Days", value: presentCount },
//         {
//             name: "Absent Days",
//             value: Math.max(totalClasses - presentCount, 0),
//         },
//     ];

//     return (
//         <div className="space-y-6">
//             <h1 className="text-2xl font-semibold">Student Dashboard</h1>

//             <div className="h-80 rounded-xl border border-gray-800 p-4">
//                 <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                         <Pie
//                             data={chartData}
//                             dataKey="value"
//                             innerRadius={60}
//                             outerRadius={90}
//                         >
//                             <Cell fill="#22c55e" />
//                             <Cell fill="#ef4444" />
//                         </Pie>
//                         <Tooltip />
//                     </PieChart>
//                 </ResponsiveContainer>
//             </div>
//         </div>
//     );
// }
import { useEffect, useState } from "react";
import { getStudentAttendanceStats } from "../../services/attendance.service";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { getMe } from "../../services/auth.service";

export default function StudentDashboard() {
    const [presentCount, setPresentCount] = useState(0);
    const [totalClasses, setTotalClasses] = useState(0);
    const [loading, setLoading] = useState(true);

useEffect(() => {
    async function load() {
        try {
        const me = await getMe();
        if (!me?.student_id) return;

        const stats = await getStudentAttendanceStats(me.student_id);
        setPresentCount(stats?.present ?? 0);
        setTotalClasses(stats?.total_classes ?? 0);
    } catch (err) {
        console.error("Dashboard load failed", err);
    } finally {
        setLoading(false);
    }
    }
    load();
}, []);

if (loading) {
    return <p className="text-gray-400">Loading dashboard...</p>;
}

const chartData = [
    { name: "Present Days", value: presentCount },
    { name: "Absent Days", value: Math.max(totalClasses - presentCount, 0) },
];

return (
    <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>

    <div className="h-80 rounded-xl border border-gray-800 p-4">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius={60} outerRadius={90}>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
        </PieChart>
        </ResponsiveContainer>
    </div>
    </div>
);
}