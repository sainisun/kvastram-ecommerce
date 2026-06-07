import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';

interface CollectionsSectionProps {
  collections: HomepageCollection[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
  const displayed = collections
    .filter((collection) => Boolean(collection.image))
    .slice(0, 12);

  if (displayed.length === 0) return null;

  return (
    <section className="kv-section collections-as-seen-section">
      <div className="kv-container">
        <div className="collections-as-seen-head">
          <div className="kv-tag">Collection edits</div>
          <h2>Handmade stories with a clear point of view</h2>
          <p>
            Explore focused edits shaped around textile mood, occasion, and everyday utility.
          </p>
        </div>

        <div className="kv-carousel collections-carousel collections-as-seen-carousel">
          {displayed.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="collection-card collections-as-seen-card kv-carousel-item group"
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
                <div className="collection-card-fallback absolute inset-0">
                  <span>{collection.title}</span>
                  <small>Handmade edit</small>
                </div>
              )}
              <div className="collection-info collections-as-seen-info">
                <span>Collection</span>
                <h3>{collection.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
