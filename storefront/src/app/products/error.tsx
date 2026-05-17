'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function ProductsError({
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
          href="/"
          className="error-back-link mb-8 inline-flex items-center gap-2 transition-colors hover:text-[var(--ds-text-primary)]"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <EmptyState
          eyebrow={error.digest ? `Error ID: ${error.digest}` : undefined}
          title="Unable to Load Products"
          description="We're having trouble loading the products right now. This might be a temporary issue. Please try again."
          className="mx-auto max-w-2xl"
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
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center border border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] px-7 font-body text-body-sm uppercase tracking-token-wider text-[var(--ds-text-primary)] type-semibold transition-colors hover:border-[var(--ds-accent-primary)] hover:text-[var(--ds-accent-primary)]"
              >
                Browse Homepage
              </Link>
            </>
          }
        />
      </div>
    </div>
  );
}
