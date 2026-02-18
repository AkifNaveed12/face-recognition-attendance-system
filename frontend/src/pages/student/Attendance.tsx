import { useEffect, useMemo, useState } from "react";
import {
    getStudentAttendanceRecords,
} from "../../services/attendance.service";
import type { AttendanceRecord } from "../../services/attendance.service";
import { getMe } from "../../services/auth.service";

export default function StudentAttendance() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthFilter, setMonthFilter] = useState("all");
    const [weekOnly, setWeekOnly] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);

useEffect(() => {
    async function load() {
        try {
        const me = await getMe(); // ✅ auth works
        setStudentId(me.student_id);

        // ✅ FETCH RECORDS (FIX)
        const data = await getStudentAttendanceRecords(me.student_id);
        setRecords(Array.isArray(data) ? data : []);
        } catch (err) {
        console.error("Failed to load attendance", err);
        setRecords([]);
        } finally {
        setLoading(false);
        }
    }

    load();
    }, []);

const filteredRecords = useMemo(() => {
    let list = [...records];

    if (monthFilter !== "all") {
        list = list.filter(r => r.date.startsWith(monthFilter));
    }

    if (weekOnly) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        list = list.filter(r => new Date(r.date) >= sevenDaysAgo);
    }

    return list;
    }, [records, monthFilter, weekOnly]);

    const attendancePercentage = useMemo(() => {
    if (filteredRecords.length === 0) return 0;
    return 100; // present-only model
    }, [filteredRecords]);

function exportCSV() {
    const header = "Date,Time,Status\n";
    const rows = filteredRecords
        .map(r => `${r.date},${r.time},Present`)
        .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.csv";
    a.click();

    URL.revokeObjectURL(url);
}

if (loading) {
    return <p className="text-gray-400">Loading attendance...</p>;
}

if (!studentId) {
    return <p className="text-red-400">Not authenticated</p>;
}

return (
    <div className="space-y-6">
    <h1 className="text-2xl font-semibold">Attendance History</h1>

      {/* Filters */}
    <div className="flex flex-wrap gap-4 items-center">
        <select
        value={monthFilter}
        onChange={e => setMonthFilter(e.target.value)}
        className="rounded border border-gray-800 bg-[#020617] px-3 py-2"
        >
            <option value="all">All Months</option>
            <option value="2026-01">Jan 2026</option>
            <option value="2026-02">Feb 2026</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
        <input
            type="checkbox"
            checked={weekOnly}
            onChange={e => setWeekOnly(e.target.checked)}
        />
            Last 7 days
        </label>

        <button
            onClick={exportCSV}
            className="rounded bg-green-600 px-4 py-2 text-black font-medium"
        >
            Export CSV
        </button>
    </div>

      {/* Percentage */}
        <div className="text-sm text-gray-400">
        Attendance Percentage:{" "}
        <span className="text-green-400 font-semibold">
            {attendancePercentage}%
        </span>
    </div>

      {/* Table */}
        <div className="rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-[#020617] text-gray-300">
            <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
            </tr>
        </thead>
        <tbody>
            {filteredRecords.map((r, idx) => (
            <tr
                key={idx}
                className="border-t border-gray-800 hover:bg-white/5"
            >
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3">{r.time}</td>
                <td className="px-4 py-3 text-green-400">
                    Present
                </td>
            </tr>
            ))}

            {filteredRecords.length === 0 && (
            <tr>
                <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-400"
                >
                    No attendance records found
                </td>
                </tr>
            )}
        </tbody>
        </table>
    </div>
    </div>
);
}
