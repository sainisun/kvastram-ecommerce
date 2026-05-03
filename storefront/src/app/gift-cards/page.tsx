import Link from 'next/link';
import { ArrowLeft, Gift } from 'lucide-react';

export const metadata = {
  title: 'Gift Cards — Kvastram',
  description: 'Give the gift of Kvastram. Gift cards coming soon.',
};

export default function GiftCardsPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-[var(--sienna-light)] flex items-center justify-center">
          <Gift size={32} className="color-sienna" />
        </div>

        <div className="space-y-3">
          <p className="text-body-xs type-bold uppercase tracking-token-wider color-muted">
            Coming Soon
          </p>
          <h1 className="text-display-xl font-serif color-ink leading-token-tight">
            Gift Cards
          </h1>
          <p className="color-muted type-light leading-token-relaxed">
            Give someone the joy of choosing their own Kvastram piece.
            Gift cards are on their way — check back soon.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center w-full bg-[var(--ink)] text-white py-4 text-body-xs type-bold uppercase tracking-token-wider hover:opacity-90 transition-opacity"
          >
            Shop Collection
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-body-sm color-muted hover:color-ink transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

