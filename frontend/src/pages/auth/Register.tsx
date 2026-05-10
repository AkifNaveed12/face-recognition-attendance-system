import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function Register() {
    const [studentId, setStudentId] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleRegister() {
        setError('');
        if (!studentId || !name || !department || !password) {
            setError('All fields are required');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', {
                student_id: studentId,
                name: name,
                department: department,
                password: password,
            });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
            <div className="relative w-full max-w-md">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Create Account
                        </h1>
                        <p className="text-sm text-slate-400">
                            Join the Face Attendance System
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            disabled={loading}
                            placeholder="Student ID (e.g. CS001)"
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                        />

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            placeholder="Full Name"
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                        />

                        <input
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            disabled={loading}
                            placeholder="Department"
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            placeholder="Password"
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                        />

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>

                        <p className="text-center text-sm text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-400 hover:underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
