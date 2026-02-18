import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { getMe } from "../../services/auth.service";

export default function WebcamPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

  // Start webcam
useEffect(() => {
    async function startCamera() {
        try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
        });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        console.error(err);
        setMessage("Camera access denied");
    }
    }

    startCamera();
}, []);

  // Temporary manual mark attendance
async function markAttendance() {
    try {
        setLoading(true);
        setMessage("");

        const me = await getMe();

        await api.post("/attendance/mark", {
        student_id: me.student_id,
    });

        setMessage("✅ Attendance marked successfully");
    } catch (err) {
        console.error(err);
        setMessage("❌ Failed to mark attendance");
    } finally {
        setLoading(false);
    }
}

return (
    <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Live Attendance</h1>

        <div className="rounded-xl overflow-hidden border border-gray-800 w-full max-w-lg">
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto"
        />
    </div>

    <button
        onClick={markAttendance}
        disabled={loading}
        className="px-6 py-3 rounded bg-blue-600 text-white font-medium disabled:opacity-50"
    >
        {loading ? "Marking..." : "Mark Attendance"}
    </button>

    {message && (
        <p className="text-sm text-gray-300">{message}</p>
    )}
    </div>
);
}
