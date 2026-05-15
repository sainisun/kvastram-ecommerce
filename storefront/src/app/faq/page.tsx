import Link from 'next/link';

import { storefrontFaqs, storefrontTrust } from '@/config/storefront-trust';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20">
        <h1 className="text-display-xl font-serif text-stone-900 mb-12 text-center">
          Frequently Asked Questions
        </h1>

        <div className="space-y-8 divide-y divide-stone-100">
          {storefrontFaqs.map((item) => (
            <div key={item.question} className="pt-8">
              <h3 className="type-bold text-body-xl text-stone-900 mb-3">
                {item.question}
              </h3>
              <p className="text-stone-600 leading-token-relaxed type-light">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href={storefrontTrust.policyRoutes.help}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Help Center
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.shipping}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Shipping Policy
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.returns}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Returns Help
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.paymentHelp}
            className="bg-stone-900 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-white transition-colors hover:bg-stone-800"
          >
            Payment Help
          </Link>
        </div>
      </div>
    </div>
  );
}

