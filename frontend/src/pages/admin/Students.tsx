import { useEffect, useState } from "react";
import type { Student } from "../../services/students";
import { getAllStudents } from "../../services/students";
import AddStudentModal from "../../components/admin/AddStudentModal";

export default function StudentsPage() {
const [students, setStudents] = useState<Student[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [showModal, setShowModal] = useState(false);

async function load() {
    try {
        const data = await getAllStudents();
        setStudents(data);
    } catch {
        setError("Failed to load students");
    } finally {
        setLoading(false);
    }
}

useEffect(() => {
    load();
}, []);

if (loading) {
    return <p className="text-gray-400">Loading students...</p>;
}

if (error) {
    return <p className="text-red-400">{error}</p>;
}

return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Students</h1>

            <button
                onClick={() => setShowModal(true)}
                className="rounded bg-green-600 px-4 py-2 text-black font-medium"
            >
                + Add Student
            </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-800">
            <table className="w-full text-left text-sm">
                <thead className="bg-[#020617] text-gray-300">
                    <tr>
                        <th className="px-4 py-3">Student ID</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Department</th>
                    </tr>
                </thead>

                <tbody>
                    {students.map((s) => (
                        <tr
                            key={s.student_id}
                            className="border-t border-gray-800 hover:bg-white/5"
                        >
                            <td className="px-4 py-3 text-green-400">
                                {s.student_id}
                            </td>
                            <td className="px-4 py-3">{s.name}</td>
                            <td className="px-4 py-3 text-gray-400">
                                {s.department}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {showModal && (
            <AddStudentModal
                onClose={() => setShowModal(false)}
                onSuccess={load}
            />
        )}
    </div>
);
}
