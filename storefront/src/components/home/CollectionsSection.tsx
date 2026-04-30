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
          <Link href="/collections" className="kv-btn">
            Browse Collections
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayed.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group relative min-h-[324px] overflow-hidden rounded-[var(--radius-lg)] bg-stone-100"
            >
              <div className="absolute inset-0">
                {collection.image ? (
                  <OptimizedImage
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#a85d3a] via-[#c4956a] to-[#174f70] font-heading text-[88px] text-white/80">
                    {collection.title.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(44,28,20,0.78),rgba(44,28,20,0.08))]" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <h3 className="font-heading text-[28px] font-bold leading-none">
                  {collection.title}
                </h3>
                <div className="mt-2 text-[15px]">Curated edit</div>
                <span className="kv-btn mt-7 border-white bg-white text-[var(--ink)]">
                  Shop Edit
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
