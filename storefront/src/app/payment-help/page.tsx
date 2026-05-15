import type { Metadata } from 'next';
import Link from 'next/link';

import { storefrontTrust } from '@/config/storefront-trust';
import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Payment Help | Kvastram',
  description:
    'Get help if a Razorpay or PayPal payment attempt fails or if you need to confirm whether your order was charged.',
  path: '/payment-help',
  keywords: ['Kvastram payment help', 'Razorpay support', 'order charged'],
});

export default function PaymentHelpPage() {
  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20">
        <div className="mb-12 text-center">
          <span className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
            Payment Support
          </span>
          <h1 className="mt-4 text-display-xl font-serif text-stone-900">
            Trouble Completing Payment?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-stone-600">
            Use this page if a Razorpay or PayPal attempt fails or if you are
            unsure whether your order was charged successfully.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="border border-stone-200 bg-stone-50 p-6">
            <h2 className="text-body-lg type-semibold text-stone-900">
              1. Do not retry blindly
            </h2>
            <p className="mt-3 text-body-sm text-stone-600">
              First confirm whether a payment actually failed or is still being
              processed to avoid duplicate attempts.
            </p>
          </div>
          <div className="border border-stone-200 bg-stone-50 p-6">
            <h2 className="text-body-lg type-semibold text-stone-900">
              2. Check your order status
            </h2>
            <p className="mt-3 text-body-sm text-stone-600">
              Use your order reference and email address on the track page if an
              order was created before the payment issue happened.
            </p>
          </div>
          <div className="border border-stone-200 bg-stone-50 p-6">
            <h2 className="text-body-lg type-semibold text-stone-900">
              3. Contact support
            </h2>
            <p className="mt-3 text-body-sm text-stone-600">
              Share the order reference, payment timestamp, and the method you
              used so support can verify the attempt safely.
            </p>
          </div>
        </div>

        <div className="mt-12 border border-stone-200 p-8">
          <h2 className="text-display-sm font-serif text-stone-900">
            Accepted payment guidance
          </h2>
          <div className="mt-4 space-y-4 text-body-md text-stone-700">
            <div>
              <p className="type-semibold text-stone-900">India (INR)</p>
              <p className="mt-1">{storefrontTrust.paymentMethodsIndia}</p>
            </div>
            <div>
              <p className="type-semibold text-stone-900">
                International buyers
              </p>
              <p className="mt-1">
                {storefrontTrust.paymentMethodsInternational}
              </p>
            </div>
          </div>
          <p className="mt-3 text-body-sm text-stone-500">
            PayPal is available for international buyers only.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href={storefrontTrust.policyRoutes.help}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Help Center
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.track}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Track Order
          </Link>
          <Link
            href={`${storefrontTrust.policyRoutes.contact}?reason=payment`}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Contact Support
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.terms}
            className="bg-stone-900 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-white transition-colors hover:bg-stone-800"
          >
            Review Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
