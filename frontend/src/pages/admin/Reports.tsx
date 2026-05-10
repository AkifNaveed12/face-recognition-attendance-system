import { useEffect, useState } from "react";
import { getAttendanceHistory, type AttendanceRecord } from "../../services/attendance.service";
import { exportAttendanceCsv } from "../../utils/exportCsv";

export default function ReportsPage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAttendanceHistory()
            .then((data) => {
                if (Array.isArray(data)) {
                    setRecords(data);
                }
            })
            .catch((err) => console.error("Failed to load history", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="p-6 text-gray-400">Loading full report history...</div>;
    }

    return (
        <div className="space-y-6 p-2">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Attendance History Report</h1>
                <button
                    onClick={() => exportAttendanceCsv(records, "Attendance_History")}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-black hover:bg-green-500 transition-colors"
                >
                    Export All to CSV
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#020617] shadow-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-gray-300">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Student ID</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Time</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-800">
                        {records.length > 0 ? (
                            records.map((r, i) => (
                                <tr key={`${r.student_id}-${i}`} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-green-400">{r.student_id}</td>
                                    <td className="px-6 py-4 text-gray-300">{r.date}</td>
                                    <td className="px-6 py-4 text-gray-400">{r.time}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                                    No records found in attendance history.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
