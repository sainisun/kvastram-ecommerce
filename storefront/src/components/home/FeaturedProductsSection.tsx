import Link from 'next/link';
import ProductCarousel from '@/components/ProductCarousel';
import type { Product } from '@/types';

interface FeaturedProductsSectionProps {
  products: Product[];
  featuredProductIds: string[];
}

export function FeaturedProductsSection({
  products,
  featuredProductIds,
}: FeaturedProductsSectionProps) {
  return (
    <section
      style={{ padding: '96px 64px', background: 'var(--off-white)' }}
    >
      <div className="section-header-prem reveal">
        <div>
          <p className="section-eyebrow-prem">
            {featuredProductIds.length > 0 ? 'Featured Collection' : 'Just Landed'}
          </p>
          <h2 className="section-title-prem">
            {featuredProductIds.length > 0 ? (
              <>
                Curated <em>For You</em>
              </>
            ) : (
              <>
                New <em>Arrivals</em>
              </>
            )}
          </h2>
        </div>
        <Link href="/products" className="link-all-prem">
          Shop All
        </Link>
      </div>
      <ProductCarousel products={products} showNavigation={true} />
    </section>
  );
}