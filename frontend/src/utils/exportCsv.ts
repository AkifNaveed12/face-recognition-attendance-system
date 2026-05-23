export function exportAttendanceCsv(
    records: { student_id: string; time: string; date?: string }[],
    date: string
) {
    const hasDate = records.some(r => r.date !== undefined);
    const headers = hasDate ? ["Student ID", "Date", "Time"] : ["Student ID", "Time"];
    const rows = records.map(r => hasDate ? [r.student_id, r.date || "", r.time] : [r.student_id, r.time]);

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
