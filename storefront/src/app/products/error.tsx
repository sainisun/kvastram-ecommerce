'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button, ButtonLink } from '@/components/ui/Button';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--ds-surface-parchment)] py-12 md:py-16 lg:py-24">
      <div className="kv-page-container mx-auto max-w-[1440px]">
        <Link
          href="/"
          className="error-back-link mb-8 inline-flex items-center gap-2 transition-colors hover:text-[var(--ds-text-primary)]"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <EmptyState
          eyebrow={error.digest ? `Error ID: ${error.digest}` : undefined}
          title="Unable to Load Products"
          description="We're having trouble loading the products right now. Please try again in a moment."
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
              <ButtonLink
                href="/"
                variant="outline"
                size="lg"
              >
                Browse Homepage
              </ButtonLink>
            </>
          }
        />
      </div>
    </div>
  );
}
