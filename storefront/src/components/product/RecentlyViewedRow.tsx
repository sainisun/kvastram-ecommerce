'use client';

import { useRecentlyViewed } from '@/context/recently-viewed-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';

interface RecentlyViewedRowProps {
  currentProductId: string;
}

export function RecentlyViewedRow({
  currentProductId,
}: RecentlyViewedRowProps) {
  const { items } = useRecentlyViewed();

  // Filter out current product and show last 6
  const filtered = items
    .filter((item) => item.id !== currentProductId)
    .slice(0, 6);

  if (filtered.length === 0) return null;

  return (
    <section className="py-16 border-t border-stone-100 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] block mb-1">
              Your Journey
            </span>
            <h2 className="font-serif text-2xl text-stone-900">
              Recently Viewed
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1"
          >
            View All →
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex overflow-x-auto gap-5 pb-4 md:grid md:grid-cols-6 md:overflow-visible md:pb-0 scrollbar-hide">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.handle}`}
              className="flex-none w-36 md:w-auto group"
            >
              {/* Image */}
              <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden mb-3 rounded-sm">
                {item.thumbnail ? (
                  <OptimizedImage
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 144px, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-200">
                    <span className="text-stone-400 text-xs font-serif italic">
                      No image
                    </span>
                  </div>
                )}
              </div>
              {/* Info */}
              <p className="font-serif text-sm text-stone-900 leading-snug group-hover:text-stone-600 transition-colors line-clamp-2 mb-1">
                {item.title}
              </p>
              <p className="text-xs text-stone-500 font-medium">
                {new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: item.currency || 'USD',
                }).format(item.price / 100)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
