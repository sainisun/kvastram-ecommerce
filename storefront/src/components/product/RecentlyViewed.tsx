'use client';

import { useRecentlyViewed } from '@/context/recently-viewed-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { useCurrency } from '@/context/currency-context';

export function RecentlyViewedSection() {
  const { items } = useRecentlyViewed();
  const { formatPrice } = useCurrency();

  if (items.length === 0) return null;

  return (
    <section className="border-t border-stone-100 py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <h2 className="text-xl font-semibold uppercase tracking-[0.06em] text-stone-900 mb-6 lg:text-2xl lg:mb-8">
          Recently Viewed
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-12 lg:grid-cols-6 lg:gap-x-8 lg:gap-y-16">
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
                {formatPrice(item.price)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
