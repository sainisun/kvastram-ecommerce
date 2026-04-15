'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useCurrency } from '@/context/currency-context';

interface Product {
  id: string;
  title: string;
  handle?: string;
  thumbnail?: string;
  collection?: { title: string };
  variants?: Array<{
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
}

interface BestsellersSectionProps {
  products: Product[];
}

export function BestsellersSection({ products }: BestsellersSectionProps) {
  const { formatPrice } = useCurrency();

  if (products.length === 0) return null;

  return (
    <section className="section-prem" style={{ background: 'var(--white)' }}>
      <div className="section-header-prem reveal">
        <div>
          <p className="section-eyebrow-prem">
            Our Top Picks
          </p>
          <h2 className="section-title-prem">
            Best <em>Sellers</em>
          </h2>
        </div>
        <Link
          href="/products"
          className="link-all-prem"
        >
          View All
        </Link>
      </div>

      <div className="product-grid-prem">
        {products.slice(0, 4).map((product: Product) => {
          const priceObj = product.variants?.[0]?.prices?.[0];
          // Find INR price first (base), fall back to first available
          const inrPriceObj = product.variants?.[0]?.prices?.find(
            (p) => p.currency_code?.toLowerCase() === 'inr'
          ) ?? priceObj;
          const price = inrPriceObj ? formatPrice(inrPriceObj.amount) : '';

          return (
            <Link
              key={product.id}
              href={`/products/${product.handle || product.id}`}
              className="prod-card-prem group"
            >
              <div className="prod-img-wrap-prem">
                {product.thumbnail ? (
                  <OptimizedImage
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--off-white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                )}
                <span className="prod-tag-prem">Bestseller</span>
                <button className="prod-quick-add-prem" tabIndex={-1}>
                  Quick Add
                </button>
              </div>
              <div className="prod-info-prem">
                <p className="prod-collection-prem">
                  {product.collection?.title || 'Kvastram'}
                </p>
                <h3 className="prod-name-prem truncate" title={product.title}>{product.title}</h3>
                {price && <p className="prod-price-prem">{price}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
