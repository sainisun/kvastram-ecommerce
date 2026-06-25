'use client';

import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useCurrency } from '@/context/currency-context';
import { CompactProductCard } from '@/components/products/ProductCard';

export function RecentlyViewedSection() {
  const { items } = useRecentlyViewed();
  const { formatPrice } = useCurrency();

  if (items.length === 0) return null;

  return (
    <section className="border-t border-[var(--ds-border-subtle)] py-12 md:py-16 lg:py-24">
      <div className="kv-page-container mx-auto max-w-[1440px]">
        <h2 className="recently-section-heading mb-6 lg:mb-8">
          Recently Viewed
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-12 lg:grid-cols-6 lg:gap-x-8 lg:gap-y-16">
          {items.slice(0, 6).map((item) => (
            <CompactProductCard
              key={item.id}
              href={`/products/${item.handle}`}
              title={item.title}
              thumbnail={item.thumbnail}
              priceLabel={formatPrice(item.price)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
