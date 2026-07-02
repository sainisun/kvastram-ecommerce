'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';
import { cn } from '@/lib/utils';

export function CollectionSlider({ collections }: { collections: HomepageCollection[] }) {
  if (!collections || collections.length === 0) return null;

  // We will feature the first one prominently, and stack the next 2.
  const featured = collections[0];
  const secondary = collections.slice(1, 3);

  return (
    <section
      className="w-full py-[var(--ds-home-section-space-mobile)] md:py-[var(--ds-home-section-space-desktop)]"
      aria-labelledby="homepage-collection-slider-title"
      data-home-section="4-collection-slider"
    >
      <div className="homepage-container">
        <div className="homepage-section-head flex flex-col items-center justify-center text-center mb-[var(--ds-space-3xl)]">
          <h2
            id="homepage-collection-slider-title"
            className="font-display text-display-lg text-primary italic font-light tracking-wide"
          >
            Curated Collections
          </h2>
          <Link
            href="/collections"
            className="mt-4 text-body-sm font-medium tracking-[0.1em] uppercase text-secondary hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-1"
          >
            View all collections
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Main Featured Collection (Left side, spans 7 cols) */}
          <Link
            href={`/collections/${featured.handle}`}
            className="relative lg:col-span-7 aspect-[4/5] lg:aspect-auto lg:min-h-[700px] overflow-hidden group block"
          >
            <OptimizedImage
              src={featured.image}
              alt={featured.title}
              fill
              sizes="(max-width: 1023px) 100vw, 60vw"
              className="object-cover motion-safe:transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
            />
            {/* Subtle Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.6)] via-[rgba(var(--ds-black-rgb),0.1)] to-transparent opacity-80" />
            
            <div className="absolute inset-x-0 bottom-0 p-8 lg:p-12 text-center lg:text-left flex flex-col justify-end">
              <h3 className="text-inverse text-display-md font-display font-light tracking-wide mb-2">
                {featured.title}
              </h3>
              {featured.description && (
                <p className="text-inverse/80 text-body-md font-light max-w-md mx-auto lg:mx-0">
                  {featured.description}
                </p>
              )}
            </div>
          </Link>

          {/* Secondary Collections (Right side, spans 5 cols) */}
          {secondary.length > 0 && (
            <div className={cn("lg:col-span-5 grid gap-4 lg:gap-6", secondary.length === 2 ? "grid-rows-2" : "grid-rows-1")}>
              {secondary.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.handle}`}
                  className="relative aspect-square lg:aspect-auto lg:h-full overflow-hidden group block"
                >
                  <OptimizedImage
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 1023px) 100vw, 40vw"
                    className="object-cover motion-safe:transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.5)] via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute inset-x-0 bottom-0 p-6 text-center lg:text-left">
                    <h3 className="text-inverse text-display-sm font-display font-light tracking-wide">
                      {collection.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
