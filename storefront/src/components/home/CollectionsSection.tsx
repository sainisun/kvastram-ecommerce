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
    <section className="homepage-section" data-home-section="6-collections">
      <div className="homepage-container">
        <div className="homepage-section-head">
          <div>
            <p className="homepage-eyebrow">Curated Collections</p>
            <h2 className="font-display text-display-md text-[var(--ds-text-primary)]">Stories in cloth</h2>
          </div>
          <Link href="/collections" className="kv-section-link">
            View all collections →
          </Link>
        </div>
        <div className="grid gap-[var(--ds-home-section-space-mobile)] md:grid-cols-2">
          {collections.slice(0, 4).map((collection) => (
            <article className="grid gap-6" key={collection.id}>
              <Link
                href={`/collections/${collection.handle}`}
                className="relative block aspect-[4/5] overflow-hidden bg-[var(--ds-surface-soft)]"
              >
                <OptimizedImage
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="object-cover"
                />
                <span className="homepage-campaign-scrim" />
                <span className="absolute inset-x-8 bottom-8 z-[1] grid gap-2 text-[var(--ds-text-inverse)]">
                  <strong className="font-display text-display-md font-[var(--ds-type-heading-weight)]">{collection.title}</strong>
                  {collection.description ? <small className="max-w-[42ch] text-body-sm">{collection.description}</small> : null}
                </span>
              </Link>
              <div className="grid grid-cols-3 gap-4" aria-label={`${collection.title} preview`}>
                {collection.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle || product.id}`}
                    data-campaign-product-id={product.id}
                    className="grid gap-2 text-[var(--ds-text-primary)] text-body-xs no-underline"
                  >
                    <span className="relative aspect-[4/5] overflow-hidden bg-[var(--ds-surface-soft)]">
                      <OptimizedImage
                        src={product.thumbnail || product.images?.[0]?.url || ''}
                        alt={product.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </span>
                    <span className="line-clamp-2">{product.title}</span>
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
