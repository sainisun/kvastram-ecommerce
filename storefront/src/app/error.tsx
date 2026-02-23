'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-serif text-stone-900 mb-4">Oops!</h1>
        <h2 className="text-2xl font-serif text-stone-700 mb-4">
          Something went wrong
        </h2>
        <p className="text-stone-600 mb-8 leading-relaxed">
          We apologize for the inconvenience. An unexpected error has occurred.
          Our team has been notified and we&apos;re working to fix it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-stone-900 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border border-stone-900 text-stone-900 px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors"
          >
            Go Home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-stone-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
