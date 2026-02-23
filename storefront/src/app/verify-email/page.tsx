'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => {
        setStatus('error');
        setMessage('No verification token provided');
      }, 0);
      return () => clearTimeout(timer);
    }

    const verifyEmail = async () => {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${API_URL}/store/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You can now login.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin mx-auto" size={48} />
            <h1 className="text-2xl font-serif text-stone-900">
              Verifying your email...
            </h1>
          </>
        )}

        {status === 'success' && (
          <>
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
              Email Verified!
            </h1>
            <p className="text-stone-500">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-stone-900 text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-serif text-stone-900">
              Verification Failed
            </h1>
            <p className="text-stone-500">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-stone-900 text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
