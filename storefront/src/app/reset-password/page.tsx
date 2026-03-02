'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation
  const [passwordValid, setPasswordValid] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    setPasswordValid({
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
    }
  }, [token, router]);

  const isPasswordValid = Object.values(passwordValid).every(Boolean);
  const passwordsMatch = password === confirmPassword && password !== '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/store/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-stone-900">
            Password Reset Successfully
          </h1>
          <p className="text-stone-500">
            Your password has been reset. You can now log in with your new
            password.
          </p>
          <Link
            href="/login"
            className="inline-block bg-stone-900 text-white px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="inline-flex items-center text-stone-500 hover:text-stone-800 mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Link>
          <h1 className="text-3xl font-serif text-stone-900">Reset Password</h1>
          <p className="mt-2 text-stone-500 font-light">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="reset-password"
              className="text-xs uppercase font-bold text-stone-500"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full border-b border-stone-200 py-2 pr-10 focus:outline-none focus:border-stone-900 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
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

            {/* Password requirements */}
            <div className="space-y-1 mt-2">
              <p className="text-xs text-stone-500 mb-2">
                Password must contain:
              </p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div
                  className={`flex items-center gap-1 ${passwordValid.length ? 'text-green-600' : 'text-stone-400'}`}
                >
                  {passwordValid.length ? <Check size={12} /> : <X size={12} />}
                  At least 12 characters
                </div>
                <div
                  className={`flex items-center gap-1 ${passwordValid.uppercase ? 'text-green-600' : 'text-stone-400'}`}
                >
                  {passwordValid.uppercase ? (
                    <Check size={12} />
                  ) : (
                    <X size={12} />
                  )}
                  One uppercase letter
                </div>
                <div
                  className={`flex items-center gap-1 ${passwordValid.lowercase ? 'text-green-600' : 'text-stone-400'}`}
                >
                  {passwordValid.lowercase ? (
                    <Check size={12} />
                  ) : (
                    <X size={12} />
                  )}
                  One lowercase letter
                </div>
                <div
                  className={`flex items-center gap-1 ${passwordValid.number ? 'text-green-600' : 'text-stone-400'}`}
                >
                  {passwordValid.number ? <Check size={12} /> : <X size={12} />}
                  One number
                </div>
                <div
                  className={`flex items-center gap-1 ${passwordValid.special ? 'text-green-600' : 'text-stone-400'}`}
                >
                  {passwordValid.special ? (
                    <Check size={12} />
                  ) : (
                    <X size={12} />
                  )}
                  One special character
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reset-confirm-password"
              className="text-xs uppercase font-bold text-stone-500"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="w-full border-b border-stone-200 py-2 pr-10 focus:outline-none focus:border-stone-900 transition-colors"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid || !passwordsMatch}
            className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
