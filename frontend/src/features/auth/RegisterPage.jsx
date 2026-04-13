import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'user'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            const userData = await register(registerData);
            navigate(userData.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-lg">
                <CardHeader
                    title="Create Account"
                    subtitle="Join Team Mavericks and register for exciting events"
                />
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <Input
                            label="Full Name"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Mobile Number"
                            name="phone"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={handleChange}
                            maxLength={10}
                            required
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Min. 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />

                        {/* Role Selector */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Register as</label>
                            <div className="flex gap-3">
                                <label
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.role === 'user'
                                        ? 'border-primary bg-blue-50 dark:bg-blue-900/20 text-primary font-semibold'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="user"
                                        checked={formData.role === 'user'}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span>👤</span> Participant
                                </label>
                                <label
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.role === 'admin'
                                        ? 'border-primary bg-blue-50 dark:bg-blue-900/20 text-primary font-semibold'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="admin"
                                        checked={formData.role === 'admin'}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span>🛡️</span> Admin
                                </label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-3 text-lg mt-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Creating Account...
                                </span>
                            ) : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary dark:text-blue-400 font-semibold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
