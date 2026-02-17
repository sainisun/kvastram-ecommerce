'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { api } from '@/lib/api';

function SetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const passwordRequirements = [
        { label: 'At least 12 characters', valid: password.length >= 12 },
        { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
        { label: 'One number', valid: /[0-9]/.test(password) },
        { label: 'One special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
        { label: 'Passwords match', valid: password === confirmPassword && password.length > 0 },
    ];

    const allRequirementsMet = passwordRequirements.slice(0, 5).every(r => r.valid) && password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            setError('Invalid or missing token');
            return;
        }

        if (!allRequirementsMet) {
            setError('Please meet all password requirements');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/store/auth/setup-password', {
                token,
                password,
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/wholesale');
                }, 2000);
            }
        } catch (err: any) {
            console.error('Setup password error:', err);
            setError(err?.error || err?.message || 'Failed to set password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
                        <p className="text-gray-600 mb-6">This password setup link is invalid or has expired.</p>
                        <Link href="/wholesale" className="text-blue-600 hover:underline">
                            Return to Wholesale
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Set!</h1>
                        <p className="text-gray-600 mb-6">Your wholesale account has been created successfully. Redirecting to wholesale...</p>
                        <Link href="/wholesale" className="text-blue-600 hover:underline">
                            Go to Wholesale Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Set Up Your Password</h1>
                    <p className="text-gray-600 mt-2">Create a password to access your wholesale account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                        <ul className="space-y-1">
                            {passwordRequirements.map((req, index) => (
                                <li key={index} className="flex items-center text-sm">
                                    {req.valid ? (
                                        <Check className="w-4 h-4 text-green-500 mr-2" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-300 mr-2" />
                                    )}
                                    <span className={req.valid ? 'text-green-700' : 'text-gray-500'}>
                                        {req.label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !allRequirementsMet}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Setting up...
                            </>
                        ) : (
                            'Set Password'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/wholesale" className="text-sm text-gray-600 hover:text-gray-900">
                        ← Back to Wholesale
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <SetPasswordContent />
        </Suspense>
    );
}
