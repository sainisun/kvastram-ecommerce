
'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function RegisterContent() {
    const { register } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/account';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log("📤 SENDING TO BACKEND:", JSON.stringify(formData));
            const result = await register(formData);
            // Show success message
            alert('Registration successful! Please check your email to verify your account.');
            router.push('/login?redirect=' + redirect);
        } catch (err: any) {
            console.error('Registration error:', err);
            
            // Extract actual error message from backend
            let errorMessage = 'Registration failed';

            if (err) {
                // Backend error: { success: false, errors: {...} }
                if (err.message && err.message.includes('Validation failed') && err.status === 400) {
                    // Try to get more specific error
                    const errorObj = err;
                    errorMessage = errorObj.message;
                }
                // Backend error: { success: false, message: "..." }
                else if (err.message && typeof err.message === 'string') {
                    errorMessage = err.message;
                }
                // Fallback
                else {
                    errorMessage = err.message || 'Registration failed';
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-20 flex items-center justify-center bg-white px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-serif text-stone-900">Join Kvastram</h1>
                    <p className="mt-2 text-stone-500 font-light">Create an account to track orders and more</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="bg-red-50 text-red-500 p-3 text-sm text-center">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-stone-500">First Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-stone-500">Last Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

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
                        <label className="text-xs uppercase font-bold text-stone-500">Phone (Optional)</label>
                        <input
                            type="tel"
                            className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-stone-500">Password</label>
                        <input
                            type="password"
                            required
                            minLength={12}
                            className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <p className="text-[10px] text-stone-400">Must be at least 12 characters with uppercase, lowercase, number, and special character.</p>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

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
                            onClick={() => alert('Social login requires backend OAuth setup. Please use email to register for now.')}
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
                            onClick={() => alert('Social login requires backend OAuth setup. Please use email to register for now.')}
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
                    Already have an account?{' '}
                    <Link href={`/login?redirect=${redirect}`} className="text-stone-900 font-medium underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-24"><Loader2 className="animate-spin" size={32} /></div>}>
            <RegisterContent />
        </Suspense>
    );
}
