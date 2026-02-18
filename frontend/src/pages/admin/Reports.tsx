import { useEffect, useState } from "react";
import { getTodayAttendance } from "../../services/attendance.service";
import { exportAttendanceCsv } from "../../utils/exportCsv";

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);

useEffect(() => {
    getTodayAttendance().then(setData);
    }, []);

if (!data) {
    return <p className="text-gray-400">Loading reports...</p>;
}

return (
    <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
        Attendance Report
        </h1>

    <button
        onClick={() =>
            exportAttendanceCsv(data.records, data.date)
        }
        className="rounded bg-green-500 px-4 py-2 text-sm font-medium text-black hover:bg-green-400"
    >
        Export CSV
    </button>

    <div className="rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
            <thead className="bg-[#020617] text-gray-300">
            <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Time</th>
            </tr>
            </thead>

        <tbody>
            {data.records.map((r: any) => (
                <tr
                key={r.student_id}
                className="border-t border-gray-800 hover:bg-white/5"
            >
                <td className="px-4 py-3 text-green-400">
                    {r.student_id}
                </td>
                <td className="px-4 py-3">
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
