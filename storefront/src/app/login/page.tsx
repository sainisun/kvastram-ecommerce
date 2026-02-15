'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

declare global {
    interface Window {
        google: any;
        fbAsyncInit: () => void;
    }
}

function LoginContent() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/account';

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResend, setShowResend] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResendSuccess(false);

        try {
            await login(formData);
            router.push(redirect);
        } catch (err: any) {
            console.error('Login error:', err);
            
            const errorMessage = 
                err?.error || 
                err?.message || 
                err?.response?.data?.error ||
                err?.response?.error ||
                'Login failed. Please try again.';
                
            setError(errorMessage);
            
            // Show resend verification option
            if (errorMessage.includes('verify your email')) {
                setShowResend(true);
            }
            
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!formData.email || !formData.email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }
        
        setResending(true);
        setError('');
        
        try {
            const { api } = await import('@/lib/api');
            await api.resendVerification(formData.email);
            setResendSuccess(true);
            setShowResend(false);
        } catch (err: any) {
            setError(err.message || 'Failed to resend verification email');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-20 flex items-center justify-center bg-white px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-serif text-stone-900">Welcome Back</h1>
                    <p className="mt-2 text-stone-500 font-light">Sign in to access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {resendSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            <p className="text-sm">Verification email sent! Please check your inbox.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-stone-500">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-stone-500">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    {showResend && (
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resending}
                                className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                            >
                                {resending ? 'Sending...' : 'Resend Verification Email'}
                            </button>
                        </div>
                    )}

                    {/* Social Login */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-stone-400">or continue with</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={async () => {
                                const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
                                if (!GOOGLE_CLIENT_ID) {
                                    alert('Google login not configured. Please use email login.');
                                    return;
                                }
                                alert('Google OAuth requires Google Cloud Console setup. Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable.');
                            }}
                            className="w-full py-3 border border-stone-200 text-stone-700 font-medium flex items-center justify-center gap-3 hover:bg-stone-50 transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
                                if (!FB_APP_ID) {
                                    alert('Facebook login not configured. Please use email login.');
                                    return;
                                }
                                alert('Facebook OAuth requires Facebook Developer Console setup. Configure NEXT_PUBLIC_FACEBOOK_APP_ID to enable.');
                            }}
                            className="w-full py-3 border border-stone-200 text-stone-700 font-medium flex items-center justify-center gap-3 hover:bg-stone-50 transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Continue with Facebook
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm text-stone-500">
                    Don&apos;t have an account?{' '}
                    <Link href={`/register?redirect=${redirect}`} className="text-stone-900 font-medium underline">
                        Create one
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-24"><Loader2 className="animate-spin" size={32} /></div>}>
            <LoginContent />
        </Suspense>
    );
}
