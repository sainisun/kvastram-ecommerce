'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-stone-50 py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <Link
          href="/"
          className="error-back-link mb-8 inline-flex items-center gap-2 transition-colors hover:text-stone-900"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="bg-white p-12 border border-stone-200 text-center max-w-2xl mx-auto">
          <h1 className="error-title mb-4">
            Unable to Load Products
          </h1>
          <p className="error-copy mb-8">
            We&apos;re having trouble loading the products right now. This might
            be a temporary issue. Please try again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="error-primary-action inline-flex items-center justify-center gap-2 bg-stone-900 px-8 py-3 transition-colors hover:bg-stone-800"
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <Link
              href="/"
              className="error-secondary-action inline-flex items-center justify-center border border-stone-900 px-8 py-3 transition-colors hover:bg-stone-100"
            >
              Browse Homepage
            </Link>
          </div>

          {error.digest && (
            <p className="error-digest mt-8">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
