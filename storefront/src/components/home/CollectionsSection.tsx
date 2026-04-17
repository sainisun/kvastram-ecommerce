import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';

interface CollectionsSectionProps {
  collections: HomepageCollection[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
  if (collections.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3 text-center sm:mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
            Featured Collections
          </p>
          <h2 className="font-heading text-[32px] font-semibold leading-[0.98] text-stone-950 sm:text-[40px] lg:text-[50px]">
            Signature edits from the current collection feed
          </h2>
          <p className="mx-auto max-w-2xl text-[15px] font-[300] leading-7 text-stone-600">
            No new CMS required. This section is driven by your existing
            collection data and re-presented as a premium homepage showcase.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className={`group relative overflow-hidden rounded-[30px] bg-stone-100 ${
                index === 0
                  ? 'sm:col-span-2 md:col-span-2 md:min-h-[520px]'
                  : 'sm:min-h-[420px] md:min-h-[520px]'
              }`}
            >
              <div className="relative aspect-[4/5] h-full md:aspect-auto">
                <OptimizedImage
                  src={collection.image || '/images/home/collection-bridal.jpg'}
                  alt={collection.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes={
                    index === 0
                      ? '(max-width: 768px) 100vw, 66vw'
                      : '(max-width: 768px) 100vw, 33vw'
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                    {index === 0 ? 'Featured Edit' : 'Collection'}
                  </p>
                  <h3 className="mt-3 font-heading text-3xl font-semibold text-white sm:text-4xl">
                    {collection.title}
                  </h3>
                  <span className="mt-5 inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-stone-900">
                    View Collection
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
