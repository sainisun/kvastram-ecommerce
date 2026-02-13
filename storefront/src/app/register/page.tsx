
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
            console.log("❌ ERROR MESSAGE:", err?.message);
            console.log("❌ FULL ERROR OBJECT:", JSON.stringify(err, null, 2));
            // Handle different error formats
            let errorMessage = 'Registration failed';

            if (err) {
                // ZodError: { issues: [...], name: 'ZodError' }
                if (err.issues && Array.isArray(err.issues) && err.issues.length > 0) {
                    errorMessage = err.issues[0].message;
                }
                // Backend error: { error: "message" }
                else if (typeof err === 'object' && err.error) {
                    errorMessage = err.error;
                }
                // Standard Error: { message: "..." }
                else if (err.message) {
                    errorMessage = err.message;
                }
                // Plain string
                else if (typeof err === 'string') {
                    errorMessage = err;
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
