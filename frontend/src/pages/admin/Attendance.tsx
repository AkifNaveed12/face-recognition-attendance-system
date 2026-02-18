// import { useEffect, useState } from "react";
// import { getTodayAttendance } from "../../services/attendance.service";
// import type { TodayAttendance } from "../../services/attendance.service";
// import { exportAttendanceCsv } from "../../utils/exportCsv";


// export default function AttendancePage() {
//     const [data, setData] = useState<TodayAttendance | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");

// useEffect(() => {
//     async function load() {
//     try {
//         const res = await getTodayAttendance();
//         setData(res);
//         } catch {
//         setError("Failed to load attendance");
//         } finally {
//         setLoading(false);
//         }
//     }

//     load();
//     const interval = setInterval(load, 5000);
//     return () => clearInterval(interval);
//     }, []);

// if (loading) {
//     return <p className="text-gray-400">Loading attendance...</p>;
// }

// if (error) {
//     return <p className="text-red-500">{error}</p>;
// }

//     if (!data) return null;

//     return (
//     <div className="space-y-4">
//         <h1 className="text-2xl font-semibold">Today Attendance</h1>

//         <button
//         onClick={() =>
//         exportAttendanceCsv(data.records, data.date)
//         }
//         className="w-fit rounded bg-green-500 px-4 py-2 text-sm font-medium text-black hover:bg-green-400"
//         >
//         Export CSV
//         </button>


//         <p className="text-sm text-gray-400">
//         Date: {data.date} | Present: {data.total_present}
//         </p>

//     <div className="rounded-lg border border-gray-800 overflow-hidden">
//         <table className="w-full text-left text-sm">
//             <thead className="bg-[#020617] text-gray-300">
//             <tr>
//                 <th className="px-4 py-3">Student ID</th>
//                 <th className="px-4 py-3">Time</th>
//             </tr>
//         </thead>

//         <tbody>
//             {data.records.map((r, i) => (
//                 <tr
//                 key={i}
//                 className="border-t border-gray-800 hover:bg-white/5"
//             >
//                 <td className="px-4 py-3 text-green-400">
//                     {r.student_id}
//                 </td>
//                 <td className="px-4 py-3 text-gray-300">
//                     {r.time}
//                 </td>
//             </tr>
//             ))}
//         </tbody>
//         </table>
//     </div>
//     </div>
// );
// }
// // ================= ADMIN / TODAY ATTENDANCE =================

// export interface TodayAttendance {
//     date: string;
//     total_present: number;
//     records: {
//     student_id: string;
//     time: string;
// }[];
// }

// export async function getTodayAttendance(): Promise<TodayAttendance> {
//     const res = await api.get("/attendance/today");
//     return res.data;
// }
import { useEffect, useState } from "react";
import { getTodayAttendance } from "../../services/attendance.service";
import type { TodayAttendance } from "../../services/attendance.service";
import { exportAttendanceCsv } from "../../utils/exportCsv";

export default function AttendancePage() {
    const [data, setData] = useState<TodayAttendance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await getTodayAttendance();
                setData(res);
            } catch {
                setError("Failed to load attendance");
            } finally {
                setLoading(false);
            }
        }

        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <p className="text-gray-400">Loading attendance...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (!data) return null;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Today Attendance</h1>

            <button
                onClick={() =>
                    exportAttendanceCsv(data.records, data.date)
                }
                className="w-fit rounded bg-green-500 px-4 py-2 text-sm font-medium text-black hover:bg-green-400"
            >
                Export CSV
            </button>

            <p className="text-sm text-gray-400">
                Date: {data.date} | Present: {data.total_present}
            </p>

            <div className="rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#020617] text-gray-300">
                        <tr>
                            <th className="px-4 py-3">Student ID</th>
                            <th className="px-4 py-3">Time</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.records.map((r, i) => (
                            <tr
                                key={i}
                                className="border-t border-gray-800 hover:bg-white/5"
                            >
                                <td className="px-4 py-3 text-green-400">
                                    {r.student_id}
                                </td>
                                <td className="px-4 py-3 text-gray-300">
                                    {r.time}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
