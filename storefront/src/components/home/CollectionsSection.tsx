import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';

interface CollectionsSectionProps {
  collections: HomepageCollection[];
}

const placeholderCollections: HomepageCollection[] = [
  {
    id: 'placeholder-kantha',
    title: 'Kantha Stories',
    handle: 'kantha-stories',
    image: null,
  },
  {
    id: 'placeholder-block-print',
    title: 'Block Print Classics',
    handle: 'block-print-classics',
    image: null,
  },
  {
    id: 'placeholder-occasion',
    title: 'Occasion Ready',
    handle: 'occasion-ready',
    image: null,
  },
];

export function CollectionsSection({ collections }: CollectionsSectionProps) {
  const displayed =
    collections.length > 0 ? collections.slice(0, 12) : placeholderCollections;

  return (
    <section className="kv-section bg-[var(--cream)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">Curated collections</div>
            <h2 className="kv-title">Shop the occasion</h2>
          </div>
          <Link href="/collections" className="kv-btn kv-btn-outline">
            Browse Collections
          </Link>
        </div>

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
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#a85d3a] via-[#c4956a] to-[#174f70] text-[72px]">
                  {collection.title.charAt(0)}
                </div>
              )}
              <div className="collection-info">
                <h3 className="font-heading font-bold">{collection.title}</h3>
                <span className="text-[13px] text-white/70">Shop Edit →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
