import { useEffect, useState } from "react";
import api from "../../services/api";
import { getAllStudents } from "../../services/students";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

/* LOCAL TYPE — backend returns this shape */
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
                const [students, res] = await Promise.all([
                    getAllStudents(),
                    api.get("/attendance/today")
                ]);
                
                setTotalStudents(students.length);
                setAttendance(res.data);
            } catch (err) {
                console.error("Admin dashboard load failed", err);
            } finally {
                setLoading(false);
            }
        }

        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center text-gray-400">
                <p>Loading overview statistics...</p>
            </div>
        );
    }

    const present = attendance.total_present;
    const absent = Math.max(totalStudents - present, 0);

    const chartData = [
        { name: "Present", value: present },
        { name: "Absent", value: absent },
    ];

    const COLORS = ["#10b981", "#ef4444"];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Admin Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 shadow-lg">
                    <p className="text-sm font-medium text-blue-400 uppercase tracking-wider">Total Students</p>
                    <p className="mt-2 text-5xl font-bold text-white">{totalStudents}</p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 shadow-lg">
                    <p className="text-sm font-medium text-green-400 uppercase tracking-wider">Today Present</p>
                    <p className="mt-2 text-5xl font-bold text-white">{present}</p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 shadow-lg">
                    <p className="text-sm font-medium text-red-400 uppercase tracking-wider">Absent</p>
                    <p className="mt-2 text-5xl font-bold text-white">{absent}</p>
                </div>
            </div>

            {totalStudents > 0 && (
                <div className="rounded-xl border border-gray-800 bg-slate-900/30 p-6 shadow-lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Today's Attendance Ratio</h2>
                    <div className="h-64 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                                    itemStyle={{ color: "#fff" }}
                                    labelStyle={{ display: "none" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}