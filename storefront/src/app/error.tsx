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
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="text-center max-w-lg">
        <h1 className="text-display-xl font-serif text-stone-900 mb-4">Oops!</h1>
        <h2 className="text-display-md font-serif text-stone-700 mb-4">
          Something went wrong
        </h2>
        <p className="text-stone-600 mb-8 leading-token-relaxed">
          We apologize for the inconvenience. An unexpected error has occurred.
          Our team has been notified and we&apos;re working to fix it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-stone-900 text-white px-8 py-3 text-body-sm type-bold uppercase tracking-token-wider hover:bg-stone-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border border-stone-900 text-stone-900 px-8 py-3 text-body-sm type-bold uppercase tracking-token-wider hover:bg-stone-100 transition-colors"
          >
            Go Home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-body-xs text-stone-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

