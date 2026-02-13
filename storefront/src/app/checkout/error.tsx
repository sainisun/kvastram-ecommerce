'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/cart" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Cart
        </Link>

        <div className="bg-white p-12 border border-stone-200 text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <ShoppingBag size={48} className="text-stone-400" />
          </div>
          <h1 className="text-3xl font-serif text-stone-900 mb-4">Checkout Error</h1>
          <p className="text-stone-600 mb-4 leading-relaxed">
            We&apos;re sorry, but we encountered an issue processing your checkout. 
            Your cart items are still saved.
          </p>
          <p className="text-sm text-stone-500 mb-8">
            Please try again. If the problem persists, contact our support team.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center border border-stone-900 text-stone-900 px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors"
            >
              Return to Cart
            </Link>
          </div>

          {error.digest && (
            <p className="mt-8 text-xs text-stone-400">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
