import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';

interface CollectionsSectionProps {
  collections: HomepageCollection[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
  const displayed =
    collections.length > 0
      ? collections.slice(0, 12)
      : [
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

  return (
    <section className="bg-[#f8f1eb] py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <div className="mb-8 text-center md:mb-12">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            Curated for you
          </div>
          <h2 className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-medium leading-[0.96] tracking-[-0.02em] text-stone-950">
            Explore our <em className="italic">world</em>
          </h2>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:gap-6 lg:gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {displayed.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group relative min-w-[78%] snap-start overflow-hidden bg-stone-100 sm:min-w-[44%] lg:min-w-[31%]"
            >
              <div className="relative aspect-[3/4]">
                {collection.image ? (
                  <OptimizedImage
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#a85d3a] via-[#c4956a] to-[#174f70] font-heading text-[72px] text-white/80">
                    {collection.title.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.6)_0%,transparent_50%)]" />
                <div className="absolute inset-x-0 bottom-0 p-8">
                  <h3 className="font-heading text-[28px] font-medium leading-[0.96] text-white">
                    {collection.title}
                  </h3>
                  <span className="mt-5 inline-flex text-[10px] font-medium uppercase tracking-[0.2em] text-white/90">
                    Shop Now →
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
