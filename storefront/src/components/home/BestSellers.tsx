import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/types';

export function BestSellers({
  products,
  state,
}: {
  products: Product[];
  state: 'ready' | 'empty' | 'error';
}) {
  return (
    <section className="homepage-section" data-home-section="4-best-sellers">
      <div className="homepage-container">
        <div className="homepage-section-head">
          <div>
            <p className="homepage-eyebrow">Most Loved Pieces</p>
            <h2>Best Sellers</h2>
          </div>
          <Link href="/bestsellers">Shop all</Link>
        </div>
        <div className="homepage-best-seller-grid">
          <ProductGrid
            initialProducts={products.slice(0, 4)}
            cardActionLabel="Shop Now"
            animateCards={false}
            emptyMessage={
              state === 'error'
                ? 'Most loved pieces are temporarily unavailable.'
                : 'Our most loved edit is being refreshed.'
            }
          />
        </div>
      </div>
    </section>
  );
}
