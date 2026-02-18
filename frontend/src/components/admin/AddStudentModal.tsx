import { useState } from "react";
import { registerStudent } from "../../services/students";

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddStudentModal({ onClose, onSuccess }: Props) {
    const [studentId, setStudentId] = useState("");
    const [name, setName] = useState("");
    const [department, setDepartment] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!image) return;

        const formData = new FormData();
        formData.append("student_id", studentId);
        formData.append("name", name);
        formData.append("department", department);
        formData.append("image", image);

        try {
            setLoading(true);
            await registerStudent(formData);
            onSuccess();
            onClose();
        } catch (e) {
            alert("Failed to register student");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-xl bg-[#020617] p-6 border border-gray-800">
                <h2 className="mb-4 text-xl font-semibold">Add Student</h2>

                <input
                    className="mb-3 w-full rounded bg-black/30 p-2"
                    placeholder="Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                />

                <input
                    className="mb-3 w-full rounded bg-black/30 p-2"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    className="mb-3 w-full rounded bg-black/30 p-2"
                    placeholder="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                />

                <input
                    type="file"
                    accept="image/*"
                    className="mb-4 w-full text-sm"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded bg-green-600 px-4 py-2 text-black font-medium"
                    >
                        {loading ? "Saving..." : "Add"}
                    </button>
                </div>
            </div>
        </div>
    );
}
