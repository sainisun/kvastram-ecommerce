'use client';

import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/types';

interface NewArrivalsProps {
  products: Product[];
  isCurated?: boolean;
}

export function NewArrivals({ products, isCurated = false }: NewArrivalsProps) {
  const displayed = products.slice(0, 4);
  if (displayed.length === 0) return null;

  return (
    <section className={isCurated ? 'kv-section bg-[var(--cream)]' : 'kv-section bg-[var(--ds-surface-paper)]'}>
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">New arrivals</div>
            <h2 className="kv-title">Fresh from the Jaipur edit</h2>
            <p className="kv-sub mt-3">
              Small-batch pieces with ready-to-shop photos, price, and craft cues.
            </p>
          </div>
          <Link
            href={isCurated ? '/products' : '/products?sort=newest'}
            className="kv-section-link"
          >
            View All
          </Link>
        </div>
        <ProductGrid initialProducts={displayed} />
      </div>
    </section>
  );
}
