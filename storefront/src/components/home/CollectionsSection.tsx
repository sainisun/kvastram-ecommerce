import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';

export function CollectionsSection({
  collections,
}: {
  collections: HomepageCollection[];
}) {
  if (collections.length === 0) return null;

  return (
    <section className="homepage-section" data-home-section="5-collections">
      <div className="homepage-container">
        <div className="homepage-section-head">
          <div>
            <p className="homepage-eyebrow">Curated Collections</p>
            <h2>Stories in cloth</h2>
          </div>
          <Link href="/collections">View all collections</Link>
        </div>
        <div className="homepage-campaign-grid">
          {collections.slice(0, 4).map((collection) => (
            <article className="homepage-campaign" key={collection.id}>
              <Link
                href={`/collections/${collection.handle}`}
                className="homepage-campaign-media"
              >
                <OptimizedImage
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="object-cover"
                />
                <span className="homepage-campaign-scrim" />
                <span className="homepage-campaign-copy">
                  <strong>{collection.title}</strong>
                  {collection.description ? <small>{collection.description}</small> : null}
                </span>
              </Link>
              <div className="homepage-campaign-products" aria-label={`${collection.title} preview`}>
                {collection.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle || product.id}`}
                    data-campaign-product-id={product.id}
                  >
                    <span className="homepage-campaign-product-media">
                      <OptimizedImage
                        src={product.thumbnail || product.images?.[0]?.url || ''}
                        alt={product.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </span>
                    <span>{product.title}</span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
