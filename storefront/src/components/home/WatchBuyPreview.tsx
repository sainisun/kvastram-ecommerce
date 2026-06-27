'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useCurrency } from '@/context/currency-context';
import type { MoneyAmount } from '@/types';
import type { HomepageTrendingReel } from '@/types/homepage';
import { Play } from 'lucide-react';

export function WatchBuyPreview({ reels }: { reels: HomepageTrendingReel[] }) {
  const { formatPrice } = useCurrency();

  if (reels.length === 0) return null;

  return (
    <section className="w-full py-[var(--ds-home-section-space-mobile)] md:py-[var(--ds-home-section-space-desktop)]" data-home-section="7-watch-shop">
      <div className="homepage-container">
        <div className="homepage-section-head flex justify-between items-end mb-[var(--ds-space-md)]">
          <div>
            <p className="homepage-eyebrow text-body-xs uppercase tracking-[var(--ds-type-label-tracking)] text-[var(--ds-accent-gold)]">Trending Reels</p>
            <h2 className="text-display-sm font-display font-medium text-[var(--ds-text-primary)]">See the craft in motion</h2>
          </div>
          <Link href="/reels" className="kv-section-link">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto no-scrollbar flex gap-[var(--ds-space-sm)] scroll-smooth">
          {reels.map((reel) => {
            const prices = reel.product.variants?.[0]?.prices || [];
            const amount =
              prices.find((item: MoneyAmount) => item.currency_code?.toLowerCase() === 'inr') ||
              prices[0];
            const price = amount ? formatPrice(amount.amount) : null;
            const productHref = reel.link_url || `/products/${reel.product.handle || reel.product.id}`;

            return (
              <div key={reel.id} className="flex-shrink-0 w-[180px] md:w-[230px] animate-fade-in group">
                <Link href={`/reels?id=${reel.id}`} className="relative block aspect-[9/16] overflow-hidden rounded-[8px] bg-[var(--ds-surface-soft)]">
                  <OptimizedImage
                    src={reel.thumbnail_url}
                    alt={reel.caption || reel.product.title}
                    fill
                    sizes="(max-width: 767px) 180px, 230px"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[rgba(var(--ds-black-rgb),0.25)] flex items-center justify-center transition-colors group-hover:bg-[rgba(var(--ds-black-rgb),0.35)]">
                    <span className="w-12 h-12 rounded-full bg-[rgba(var(--ds-white-rgb),0.95)] flex items-center justify-center text-[var(--ds-text-primary)] shadow-md transition-transform duration-300 group-hover:scale-110">
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </span>
                  </div>
                </Link>

                <div className="mt-[var(--ds-space-xs)] text-left">
                  <h3 className="text-body-sm type-medium text-[var(--ds-text-primary)] line-clamp-1 group-hover:text-[var(--ds-accent-primary)] transition-colors" title={reel.product.title}>
                    {reel.product.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    {price ? <PriceDisplay price={price} variant="inline" /> : <span />}
                    <Link href={productHref} className="text-body-xs font-ui font-semibold text-[var(--ds-accent-gold)] hover:text-[var(--ds-text-primary)] transition-colors uppercase tracking-wider">
                      Shop
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
