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
          <div className="kv-tag">Bestsellers</div>
          <Link href="/bestsellers" className="kv-section-link">
            View All
          </Link>
        </div>
        <ProductGrid initialProducts={displayed} />
      </div>
    </section>
  );
}
