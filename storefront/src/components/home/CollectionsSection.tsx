import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: string;
}

interface CollectionsSectionProps {
  collections: Collection[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
  if (collections.length === 0) return null;

  return (
    <section
      style={{ padding: '96px 64px', background: 'var(--off-white)' }}
    >
      <div className="section-header-prem reveal">
        <div>
          <p className="section-eyebrow-prem">Exclusive</p>
          <h2 className="section-title-prem">
            Featured <em>Collections</em>
          </h2>
        </div>
      </div>
      <div className="collections-grid-prem reveal reveal-delay-1">
        {collections.map((collection: Collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.handle}`}
            className="coll-card-prem group"
          >
            <OptimizedImage
              src={collection.image || '/images/home/collection-bridal.jpg'}
              alt={collection.title}
              fill
              className="object-cover"
              sizes="(max-width: 900px) 100vw, 50vw"
            />
            <div className="coll-content-prem">
              <p className="coll-label-prem">Exclusively For</p>
              <h3 className="coll-name-prem">{collection.title}</h3>
              <span className="coll-cta-prem">View Collection</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}