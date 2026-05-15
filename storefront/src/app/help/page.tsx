import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, LifeBuoy, PackageSearch, RotateCcw } from 'lucide-react';

import { storefrontTrust } from '@/config/storefront-trust';
import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Help Center | Kvastram',
  description:
    'Use the Kvastram Help Center to track orders, resolve payment issues, understand returns, and reach support quickly.',
  path: '/help',
  keywords: ['Kvastram help center', 'order support', 'payment help'],
});

const helpCards = [
  {
    title: 'Track an order',
    description:
      'Check live order status, shipment milestones, and delivery updates using your order ID and email address.',
    href: storefrontTrust.policyRoutes.track,
    cta: 'Track Order',
    icon: PackageSearch,
  },
  {
    title: 'Resolve payment issues',
    description:
      'Use the payment-help route if a Razorpay or PayPal attempt fails or if you are unsure whether you were charged.',
    href: storefrontTrust.policyRoutes.paymentHelp,
    cta: 'Payment Help',
    icon: CreditCard,
  },
  {
    title: 'Returns and refunds',
    description:
      'Review return guidance, refund rules, and your existing return activity before contacting the team.',
    href: storefrontTrust.policyRoutes.returns,
    cta: 'Returns Help',
    icon: RotateCcw,
  },
  {
    title: 'Contact support directly',
    description:
      'If you already know what you need, send a structured support request with your order reference and issue.',
    href: storefrontTrust.policyRoutes.contact,
    cta: 'Contact Support',
    icon: LifeBuoy,
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
            Support Hub
          </span>
          <h1 className="mt-4 text-display-xl font-serif text-stone-900">
            Kvastram Help Center
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-stone-600">
            Start here if you need order tracking, payment recovery, return
            guidance, or direct support. This hub is designed to reduce dead
            ends and move buyers to the right resolution path faster.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {helpCards.map(({ title, description, href, cta, icon: Icon }) => (
            <div key={title} className="border border-stone-200 bg-stone-50 p-6">
              <Icon className="text-stone-900" size={26} />
              <h2 className="mt-4 text-body-lg type-semibold text-stone-900">
                {title}
              </h2>
              <p className="mt-3 text-body-sm leading-token-relaxed text-stone-600">
                {description}
              </p>
              <Link
                href={href}
                className="mt-5 inline-flex border border-stone-300 bg-white px-5 py-3 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-100"
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 border border-stone-200 bg-white p-8">
          <h2 className="text-display-sm font-serif text-stone-900">
            Before you contact support
          </h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-body-sm text-stone-700">
            <li>Keep your order reference and purchase email ready.</li>
            <li>Do not retry payment blindly if you are unsure whether it failed.</li>
            <li>Review shipping and refund guidance before assuming eligibility.</li>
            <li>Use the order tracking route first for shipment-status questions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
