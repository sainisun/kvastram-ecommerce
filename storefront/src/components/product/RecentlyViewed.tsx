'use client';

import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useShop } from '@/context/shop-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';

export function RecentlyViewedSection() {
  const { items } = useRecentlyViewed();
  const { currentRegion } = useShop();

  if (items.length === 0) return null;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };

  return (
    <section className="py-12 border-t border-stone-100 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-xl font-semibold uppercase tracking-[0.06em] text-stone-900 mb-6 lg:text-2xl lg:mb-8">
          Recently Viewed
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
          {items.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.handle}`}
              className="group block"
            >
              <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden mb-3 rounded-sm">
                {item.thumbnail ? (
                  <OptimizedImage
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="text-sm text-stone-900 font-medium line-clamp-1 group-hover:text-stone-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                {formatPrice(item.price, item.currency)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
