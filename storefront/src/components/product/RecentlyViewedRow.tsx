'use client';

import React from 'react';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { useCurrency } from '@/context/currency-context';

interface RecentlyViewedRowProps {
  currentProductId: string;
}

function RecentlyViewedRowComponent({ currentProductId }: RecentlyViewedRowProps) {
  const { items } = useRecentlyViewed();
  const { formatPrice } = useCurrency();

  // Filter out current product and show last 6
  const filtered = items
    .filter((item) => item.id !== currentProductId)
    .slice(0, 6);

  if (filtered.length === 0) return null;

  return (
    <section className="border-t border-stone-100 bg-stone-50 py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-body mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400">
              Your Journey
            </span>
            <h2 className="font-heading text-[28px] font-semibold uppercase tracking-[0.02em] text-stone-900 md:text-[36px]">
              Recently Viewed
            </h2>
          </div>
          <Link
            href="/products"
            className="font-body flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.1em] text-stone-500 transition-colors hover:text-stone-900"
          >
            View All →
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-6 md:gap-6 md:overflow-visible md:pb-0 lg:gap-8 scrollbar-hide">
          {filtered.map((item) => (
            <Link key={item.id} href={`/products/${item.handle}`} className="flex-none w-36 md:w-auto group">
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
                    <span className="font-heading text-xs italic text-stone-400">
                      No image
                    </span>
                  </div>
                )}
              </div>
              {/* Info */}
              <p
                className="font-body mb-1 truncate text-[14px] font-medium leading-[1.45] tracking-[0.03em] text-stone-900 transition-colors group-hover:text-stone-600"
                title={item.title}
              >
                {item.title}
              </p>
              <p className="font-body text-[14px] font-normal text-stone-500">
                {formatPrice(item.price)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export const RecentlyViewedRow = React.memo(RecentlyViewedRowComponent);
