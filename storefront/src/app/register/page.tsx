'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await register(formData);
      setSuccess(true);
      const redirect = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
      setTimeout(() => {
        router.push(redirect || '/login');
      }, 2000);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      let errorMessage = 'Registration failed';
      
      if (err instanceof Error) {
        errorMessage = err.message || 'Registration failed';
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
          <p className="mt-2 text-stone-500 font-light">
            Create an account to track orders and more
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <div className="bg-green-50 text-green-600 p-3 text-sm text-center">
              Registration successful! Please check your email to verify your account.
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 text-sm text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-stone-500">
                First Name
              </label>
              <input
                type="text"
                required
                className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-stone-500">
                Last Name
              </label>
              <input
                type="text"
                required
                className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-stone-500">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-stone-500">
              Phone (Optional)
            </label>
            <input
              type="tel"
              className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-stone-500">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={12}
                className="w-full border-b border-stone-200 py-2 pr-10 focus:outline-none focus:border-stone-900 transition-colors"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-stone-400">
              Must be at least 12 characters with uppercase, lowercase, number,
              and special character.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center text-sm text-stone-500">
            Already have an account?{' '}
            <Link href="/login" className="text-stone-900 font-medium underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
