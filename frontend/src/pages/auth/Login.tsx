import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

interface ValidationErrors {
    username?: string;
    password?: string;
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isExpired = searchParams.get('expired') === 'true';

    // Validate individual field
    const validateField = (
        name: 'username' | 'password',
        value: string
    ): string => {
        if (name === 'username') {
            if (!value.trim()) return 'Username is required';
            if (value.length < 2)
                return 'Username must be at least 2 characters';
        }

        if (name === 'password') {
            if (!value) return 'Password is required';
            if (value.length < 2)
                return 'Password must be at least 2 characters';
        }

        return '';
    };

    const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsername(value);
        setError('');

        if (errors.username !== undefined) {
            setErrors(prev => ({
                ...prev,
                username: validateField('username', value),
            }));
        }
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setError('');

        if (errors.password !== undefined) {
            setErrors(prev => ({
                ...prev,
                password: validateField('password', value),
            }));
        }
    };

    const handleUsernameBlur = () => {
        setErrors(prev => ({
            ...prev,
            username: validateField('username', username),
        }));
    };

    const handlePasswordBlur = () => {
        setErrors(prev => ({
            ...prev,
            password: validateField('password', password),
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {
            username: validateField('username', username),
            password: validateField('password', password),
        };

        setErrors(newErrors);
        return !newErrors.username && !newErrors.password;
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    async function handleLogin() {
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            // IMPORTANT: OAuth2PasswordRequestForm needs FORM DATA
            const body = new URLSearchParams();
            body.append('username', username);
            body.append('password', password);

            const res = await api.post('/auth/login', body, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            localStorage.setItem('token', res.data.access_token);

            if (username === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/student', { replace: true });
            }
        } catch (err) {
            setError('Invalid credentials. Please try again.');
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
                            Face Attendance Software
                        </h1>
                        <p className="text-2xl font-semibold text-white mb-1">
                            Welcome Back 👋
                        </p>
                        <p className="text-sm text-slate-400">
                            Sign in to access your attendance dashboard
                        </p>
                    </div>

                    <div className="space-y-5">
                        {isExpired && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm text-center">
                                Your session has expired. Please sign in again.
                            </div>
                        )}

                        <input
                            value={username}
                            onChange={handleUsernameChange}
                            onBlur={handleUsernameBlur}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="Enter your username (e.g. CS001)"
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white"
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            onBlur={handlePasswordBlur}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white"
                        />

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold"
                        >
                            {loading ? 'Logging in...' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
