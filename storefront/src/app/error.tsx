'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

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
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-[var(--ds-surface-parchment)] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <EmptyState
        eyebrow={error.digest ? `Error ID: ${error.digest}` : 'Oops'}
        title="Something went wrong"
        description="We apologize for the inconvenience. An unexpected error has occurred. Our team has been notified and we're working to fix it."
        className="max-w-2xl"
        actions={
          <>
            <Button onClick={reset} variant="secondary" size="lg">
             Try Again
            </Button>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center border border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] px-7 font-body text-body-sm uppercase tracking-token-wider text-[var(--ds-text-primary)] type-semibold transition-colors hover:border-[var(--ds-accent-primary)] hover:text-[var(--ds-accent-primary)]"
            >
              Go Home
            </Link>
          </>
        }
      />
    </div>
  );
}
