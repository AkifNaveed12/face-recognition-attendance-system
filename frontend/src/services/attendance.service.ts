import api from "./api";

export interface AttendanceRecord {
    student_id: string;
    date: string;
    time: string;
}

export interface AttendanceStats {
    student_id: string;
    present: number;
    total_classes: number;
    attendance_percentage: number;
}

// Stats for dashboard
export async function getStudentAttendanceStats(studentId: string): Promise<AttendanceStats> {
    const res = await api.get(`/attendance/student/${studentId}`);
    return res.data;
}
export interface TodayAttendance {
    date: string;
    total_present: number;
    records: AttendanceRecord[];
}

// Records for attendance history table
export async function getStudentAttendanceRecords(
    studentId: string
): Promise<AttendanceRecord[]> {
    const res = await api.get(`/attendance/student/${studentId}/records`);
    return res.data;
}
/* ========= API ========= */

export async function getTodayAttendance(): Promise<TodayAttendance> {
    const res = await api.get("/attendance/today");
    return res.data;
}