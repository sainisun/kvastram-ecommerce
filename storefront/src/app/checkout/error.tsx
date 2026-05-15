'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';
import { storefrontTrust } from '@/config/storefront-trust';

export default function CheckoutError({
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
          href="/cart"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 text-body-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Cart
        </Link>

        <div className="bg-white p-12 border border-stone-200 text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <ShoppingBag size={48} className="text-stone-400" />
          </div>
          <h1 className="text-display-lg font-serif text-stone-900 mb-4">
            Checkout Error
          </h1>
          <p className="text-stone-600 mb-4 leading-token-relaxed">
            We&apos;re sorry, but we encountered an issue processing your
            checkout. Your cart items are still saved.
          </p>
          <p className="text-body-sm text-stone-500 mb-8">
            Please try again. If the problem persists, contact our support team.
          </p>

          <div className="mb-8 rounded-md border border-stone-200 bg-stone-50 p-4 text-left text-body-sm text-stone-600">
            <p className="font-medium text-stone-900">Need help before retrying?</p>
            <p className="mt-2">
              If you are unsure whether a payment was charged, use payment help
              or contact support before placing another attempt.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-body-xs uppercase tracking-token-wider">
              <Link
                href={storefrontTrust.policyRoutes.paymentHelp}
                className="text-stone-900 underline underline-offset-4"
              >
                Payment Help
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.contact}
                className="text-stone-900 underline underline-offset-4"
              >
                Contact Support
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.track}
                className="text-stone-900 underline underline-offset-4"
              >
                Track Order
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-8 py-3 text-body-sm type-bold uppercase tracking-token-wider hover:bg-stone-800 transition-colors"
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center border border-stone-900 text-stone-900 px-8 py-3 text-body-sm type-bold uppercase tracking-token-wider hover:bg-stone-100 transition-colors"
            >
              Return to Cart
            </Link>
          </div>

          {error.digest && (
            <p className="mt-8 text-body-xs text-stone-400">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

