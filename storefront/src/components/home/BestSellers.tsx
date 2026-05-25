'use client';

import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/types';

interface BestSellersProps {
  products: Product[];
}

export function BestSellers({ products }: BestSellersProps) {
  const displayed = products.slice(0, 4);

  if (displayed.length === 0) return null;

  return (
    <section className="kv-section bg-[var(--cream)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">Customer favourites</div>
            <h2 className="kv-title">Most loved handmade pieces</h2>
            <p className="kv-sub mt-3">
              Pieces customers return for: light quilting, soft cotton, easy styling, and giftable finishes.
            </p>
          </div>
          <Link href="/bestsellers" className="kv-section-link">
            View All
          </Link>
        </div>
        <ProductGrid initialProducts={displayed} />
      </div>
    </section>
  );
}
