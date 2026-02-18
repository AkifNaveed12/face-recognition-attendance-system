import api from "./api";

export interface Student {
    student_id: string;
    name: string;
    department: string;
}

export async function getAllStudents(): Promise<Student[]> {
    const response = await api.get("/students/all");
    return response.data;
}

export async function registerStudent(formData: FormData) {
    const res = await api.post("/students/register", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return res.data;
}