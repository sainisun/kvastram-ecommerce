import Link from 'next/link';
import { Globe, Clock } from 'lucide-react';

import { storefrontTrust } from '@/config/storefront-trust';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20">
        <div className="text-center mb-16 space-y-4">
          <span className="text-body-xs type-bold tracking-token-wider text-stone-500 uppercase">
            Global Fulfillment
          </span>
          <h1 className="text-display-xl font-serif text-stone-900">
            Shipping & Delivery
          </h1>
        </div>

        <div className="mb-12 grid gap-8 md:mb-16 md:grid-cols-2 lg:gap-16">
          <div className="bg-stone-50 p-8 space-y-4">
            <Globe className="text-stone-900" size={32} />
            <h3 className="type-bold text-body-xl text-stone-900">
              Shipping availability
            </h3>
            <p className="text-stone-600 type-light text-body-sm leading-token-relaxed">
              {storefrontTrust.shippingSummary}
            </p>
          </div>
          <div className="bg-stone-50 p-8 space-y-4">
            <Clock className="text-stone-900" size={32} />
            <h3 className="type-bold text-body-xl text-stone-900">
              Delivery timing
            </h3>
            <p className="text-stone-600 type-light text-body-sm leading-token-relaxed">
              Delivery estimates vary by destination, stock position, and the
              shipping method shown at checkout. Always use the checkout summary
              as the final promise before payment.
            </p>
          </div>
        </div>

        <div className="prose prose-stone max-w-none">
          <h3>Shipping methods and rates</h3>
          <p>
            Shipping rates, taxes, and available methods are confirmed after
            you enter your delivery address during checkout. This protects
            buyers from seeing inaccurate hardcoded delivery promises.
          </p>

          <h3>Processing</h3>
          <p>
            Order preparation time can vary by item availability, hand-finished
            processes, and order volume. Tracking details are shared once your
            order is dispatched.
          </p>

          <h3>Duties, taxes, and region rules</h3>
          <p>
            Duties, import handling, and checkout taxes may vary by destination.
            The amount displayed during checkout should be treated as the final
            customer-facing payment summary for that order.
          </p>

          <h3>Returns and support</h3>
          <p>
            Return and refund eligibility is handled separately from shipping.
            Please review the returns guidance and refund policy before
            purchase.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href={storefrontTrust.policyRoutes.help}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Help Center
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.refundPolicy}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Refund Policy
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.returns}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Returns Help
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.contact}
            className="bg-stone-900 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-white transition-colors hover:bg-stone-800"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

