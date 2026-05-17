import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-[var(--ds-surface-parchment)] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <EmptyState
        eyebrow="404"
        title="Page Not Found"
        description="Sorry, the page you are looking for does not exist. It might have been moved or deleted."
        className="max-w-2xl"
        actions={
          <>
          <Link
            href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--ds-text-primary)] bg-[var(--ds-text-primary)] px-7 font-body text-body-sm uppercase tracking-token-wider text-[var(--ds-text-inverse)] type-semibold transition-colors hover:border-[var(--ds-accent-hover)] hover:bg-[var(--ds-accent-hover)]"
          >
            <Home size={16} />
            Go Home
          </Link>
          <Link
            href="/search"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] px-7 font-body text-body-sm uppercase tracking-token-wider text-[var(--ds-text-primary)] type-semibold transition-colors hover:border-[var(--ds-accent-primary)] hover:text-[var(--ds-accent-primary)]"
          >
            <Search size={16} />
            Search
          </Link>
          <Link
            href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-transparent px-4 font-body text-body-sm text-[var(--ds-text-muted)] transition-colors hover:text-[var(--ds-text-primary)]"
          >
            <ArrowLeft size={16} />
              Back to homepage
          </Link>
          </>
        }
      />
    </div>
  );
}
