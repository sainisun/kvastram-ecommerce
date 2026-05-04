import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';

interface CollectionsSectionProps {
  collections: HomepageCollection[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
  const displayed = collections.slice(0, 12);

  return (
    <section className="kv-section bg-[var(--cream)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <h2 className="kv-title">Shop the occasion</h2>
          <Link href="/collections" className="kv-section-link">
            View All
          </Link>
        </div>

        {displayed.length > 0 ? (
          <div className="collections-grid featured">
            {displayed.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.handle}`}
                className="collection-card group"
              >
                {collection.image ? (
                  <div className="absolute inset-0">
                    <OptimizedImage
                      src={collection.image}
                      alt={collection.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#a85d3a] via-[#c4956a] to-[#174f70] text-display-xl">
                    {collection.title.charAt(0)}
                  </div>
                )}
                <div className="collection-info">
                  <h3 className="font-heading type-bold">{collection.title}</h3>
                  <span className="text-body-sm text-white/70">Shop Edit</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-white px-6 py-12 text-center">
            <p className="kv-tag">No collections live</p>
            <p className="mx-auto mt-2 max-w-md text-body-sm leading-6 color-muted">
              Add active collections with storefront handles to show this section.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

