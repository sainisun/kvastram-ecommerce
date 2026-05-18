'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';
import { storefrontTrust } from '@/config/storefront-trust';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBanner } from '@/components/ui/StatusBanner';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--ds-surface-parchment)] py-12 md:py-16 lg:py-24">
      <div className="kv-page-container mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] mb-8 text-body-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Cart
        </Link>

        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={<ShoppingBag size={48} />}
            eyebrow={error.digest ? `Error ID: ${error.digest}` : undefined}
            title="Checkout Error"
            description="We're sorry, but we encountered an issue processing your checkout. Your cart items are still saved. Please try again, and contact support if the problem persists."
            actions={
              <>
                <Button
                  onClick={reset}
                  variant="secondary"
                  size="lg"
                  leadingIcon={<RefreshCw size={16} />}
                >
                  Try Again
                </Button>
                <ButtonLink
                  href="/cart"
                  variant="outline"
                  size="lg"
                >
                  Return to Cart
                </ButtonLink>
              </>
            }
          />

          <StatusBanner title="Need help before retrying?" className="mt-6">
            <p>
              If you are unsure whether a payment was charged, use payment help
              or contact support before placing another attempt.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-body-xs  tracking-token-wider">
              <Link
                href={storefrontTrust.policyRoutes.paymentHelp}
                className="underline underline-offset-4"
              >
                Payment Help
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.contact}
                className="underline underline-offset-4"
              >
                Contact Support
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.track}
                className="underline underline-offset-4"
              >
                Track Order
              </Link>
            </div>
          </StatusBanner>
        </div>
      </div>
    </div>
  );
}
