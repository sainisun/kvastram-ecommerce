'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import Input from '@/components/ui/Input';

function SuccessView({ email }: { readonly email: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
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
        <h1 className="text-display-md font-serif text-stone-900">Check Your Email</h1>
        <p className="text-stone-500">
          If an account exists with <strong>{email}</strong>, you will receive a
          password reset link.
        </p>
        <p className="text-stone-400 text-body-sm">
          Check your spam folder if you don&apos;t receive the email within a
          few minutes.
        </p>
        <Link
          href="/login"
          className="inline-block text-stone-900 type-medium underline"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/store/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setSubmitted(true);
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

  if (submitted) return <SuccessView email={email} />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-stone-500 hover:text-stone-800 mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Login
          </Link>
          <h1 className="text-display-lg font-serif text-stone-900">
            Forgot Password?
          </h1>
          <p className="mt-2 text-stone-500 type-light">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-body-sm">{error}</p>
            </div>
          )}

          <Input
            id="forgot-email"
            type="email"
            required
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-4 type-bold uppercase tracking-token-wider text-body-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}

