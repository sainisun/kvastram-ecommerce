import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

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
  if (products.length === 0) return null;

  return (
    <section
      style={{ padding: '96px 64px', background: 'var(--black)' }}
    >
      <div className="section-header-prem reveal">
        <div>
          <p
            className="section-eyebrow-prem"
            style={{ color: 'rgba(248,246,243,0.4)' }}
          >
            Our Top Picks
          </p>
          <h2
            className="section-title-prem"
            style={{ color: 'var(--white)' }}
          >
            Best <em>Sellers</em>
          </h2>
        </div>
        <Link
          href="/products"
          className="link-all-prem"
          style={{ color: 'var(--white)' }}
        >
          View All
        </Link>
      </div>

      <div className="product-grid-prem">
        {products.slice(0, 4).map((product: Product) => {
          const priceObj = product.variants?.[0]?.prices?.[0];
          const price = priceObj
            ? new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: priceObj.currency_code?.toUpperCase() || 'USD',
              }).format(priceObj.amount / 100)
            : '';

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
                <h3 className="prod-name-prem">{product.title}</h3>
                {price && <p className="prod-price-prem">{price}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}