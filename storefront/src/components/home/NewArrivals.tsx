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
    <section className={isCurated ? 'kv-section bg-[var(--cream)]' : 'kv-section bg-white'}>
      <div className="kv-container">
        <div className="kv-section-head">
          <h2 className="kv-title">Fresh from the studio</h2>
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
