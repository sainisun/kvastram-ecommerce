
'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function LoginContent() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/account';

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData);
            router.push(redirect);
        } catch {
            setError('Invalid credentials');
            setLoading(false);
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
                    {error && <div className="bg-red-50 text-red-500 p-3 text-sm text-center">{error}</div>}

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
