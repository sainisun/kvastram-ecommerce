import Link from 'next/link';
import { ArrowLeft, Gift } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata = {
  title: 'Gift Cards - Kvastram',
  description: 'Give the gift of Kvastram. Gift cards coming soon.',
};

export default function GiftCardsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-6 py-24">
      <EmptyState
        icon={<Gift size={40} />}
        eyebrow="Coming Soon"
        title="Gift Cards"
        description="Give someone the joy of choosing their own Kvastram piece. Gift cards are on their way. Check back soon."
        className="max-w-md"
        actions={
          <div className="w-full space-y-3">
            <Link
              href="/products"
              className="inline-flex w-full items-center justify-center bg-[var(--ink)] py-4 text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-inverse)] transition-opacity hover:opacity-90"
            >
              Shop Collection
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 text-body-sm color-muted transition-colors hover:color-ink"
            >
              <ArrowLeft size={14} />
              Back to Home
            </Link>
          </div>
        }
      />
    </div>
  );
}
