import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gift, Layers3, Sparkles, Tags, Wand2 } from 'lucide-react';

import { storefrontTrust } from '@/config/storefront-trust';
import { buildBasicPageMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { cardClasses } from '@/components/ui/Card';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Curated Edits | Kvastram',
  description:
    'Browse curated Kvastram edits for gifting, bestsellers, new arrivals, block prints, sale picks, and collection-led discovery.',
  path: '/edits',
  keywords: [
    'Kvastram curated edits',
    'gift guide',
    'bestsellers',
    'block print edit',
  ],
});

const editCards = [
  {
    title: 'Gift Edit',
    copy:
      'Start with gift-friendly picks and easy browsing paths for thoughtful premium gifting.',
    href: '/collections/gifts-under-2000',
    icon: Gift,
    accent: 'from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-accent-soft)]',
  },
  {
    title: 'Block Print Edit',
    copy:
      'Jump into handcrafted block-print styles instead of starting from the full catalog.',
    href: '/collections/block-print-edit',
    icon: Wand2,
    accent: 'from-[var(--ds-success-text)] via-[var(--ds-success)] to-[var(--ds-success-bg)]',
  },
  {
    title: 'Bestsellers',
    copy:
      'Browse the pieces that already carry the strongest shopper proof and repeat interest.',
    href: '/bestsellers',
    icon: Sparkles,
    accent: 'from-[var(--ds-text-primary)] via-[var(--ds-text-muted)] to-[var(--ds-accent-soft)]',
  },
  {
    title: 'New Arrivals',
    copy:
      'See the freshest additions without having to build the right sort and filter combination yourself.',
    href: '/products?sort=newest',
    icon: Tags,
    accent: 'from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-surface-soft)]',
  },
  {
    title: 'Collections',
    copy:
      'Explore story-led collection pages that behave more like curated rooms than a flat product listing.',
    href: '/collections',
    icon: Layers3,
    accent: 'from-[var(--ds-accent-hover)] via-[var(--ds-accent-gold)] to-[var(--ds-surface-soft)]',
  },
  {
    title: 'Sale Picks',
    copy:
      'Enter the current markdown layer quickly when you are shopping by value instead of collection.',
    href: '/sale',
    icon: ArrowRight,
    accent: 'from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-danger-bg)]',
  },
];

export default function EditsPage() {
  return (
    <div className="min-h-screen bg-[var(--ds-surface-paper)] py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
      <div className="kv-page-container mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-body-xs type-bold  tracking-token-wider text-[var(--ds-text-muted)]">
            Guided Discovery
          </span>
          <h1 className="mt-4 font-display text-display-xl text-[var(--ds-text-primary)]">
            Curated Edits
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-[var(--ds-text-secondary)]">
            Use curated routes when you want a faster way into the storefront
            than broad search, generic filters, or starting from every product
            at once.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {editCards.map(({ title, copy, href, icon: Icon, accent }) => (
            <Link
              key={title}
              href={href}
              className={cn(
                cardClasses,
                'group block overflow-hidden transition-colors hover:border-[var(--ds-border-strong)]'
              )}
            >
              <div className={`bg-gradient-to-br ${accent} p-6 text-[var(--ds-text-inverse)]`}>
                <Icon size={28} />
                <h2 className="mt-12 text-display-sm font-display">{title}</h2>
              </div>
              <div className="p-6">
                <p className="text-body-sm leading-token-relaxed text-[var(--ds-text-secondary)]">
                  {copy}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-body-xs type-bold  tracking-token-wider text-[var(--ds-text-primary)]">
                  Open Edit <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Link
            href="/products"
            className="border border-[var(--ds-border-strong)] px-6 py-4 text-center text-body-sm type-bold  tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-surface-parchment)]"
          >
            Shop All
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.help}
            className="border border-[var(--ds-border-strong)] px-6 py-4 text-center text-body-sm type-bold  tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-surface-parchment)]"
          >
            Help Center
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.contact}
            className="bg-[var(--ds-text-primary)] px-6 py-4 text-center text-body-sm type-bold  tracking-token-wider text-[var(--ds-text-inverse)] transition-colors hover:bg-[var(--ds-text-secondary)]"
          >
            Contact Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
