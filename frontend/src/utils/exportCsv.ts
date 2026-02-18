export function exportAttendanceCsv(
    records: { student_id: string; time: string }[],
    date: string
) {
    const headers = ["Student ID", "Time"];
    const rows = records.map(r => [r.student_id, r.time]);

const csv =
    [headers, ...rows]
        .map(row => row.join(","))
        .join("\n");

const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = `attendance_${date}.csv`;
link.click();

URL.revokeObjectURL(url);
}
