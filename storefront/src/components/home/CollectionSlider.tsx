'use client';

import Link from 'next/link';
import {
  HomepageSectionHeader,
  HomepageContainer,
  homepageSectionSpacingClassName,
  OptimizedImage,
  homepageSectionActionClassName,
} from '@/design-system';
import type { HomepageCollection } from '@/types/homepage';
import { cn } from '@/lib/utils';

export function CollectionSlider({ collections }: { collections: HomepageCollection[] }) {
  if (!collections || collections.length === 0) return null;

  const featured = collections[0];
  const secondary = collections.slice(1, 3);
  const remaining = collections.slice(3);

  return (
    <section
      aria-labelledby="homepage-collection-slider-title"
      data-home-section="4-collection-slider"
      className={homepageSectionSpacingClassName}
    >
      <HomepageContainer>
        <HomepageSectionHeader
          heading="Curated Collections"
          headingId="homepage-collection-slider-title"
          align="center"
          headingClassName="font-light italic tracking-wide"
          action={
            <Link href="/collections" className={homepageSectionActionClassName}>
              View All
            </Link>
          }
        />
      </HomepageContainer>

      {/* GAPLESS EDGE-TO-EDGE GRID */}
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-12 w-full">
        <Link
          href={`/collections/${featured.handle}`}
          className="group flex flex-col relative lg:col-span-7 lg:min-h-[700px] overflow-hidden"
        >
          <div className="relative w-full flex-grow overflow-hidden aspect-[4/5] lg:aspect-auto bg-surface-soft">
            <OptimizedImage
              src={featured.image}
              alt={featured.title}
              fill
              sizes="(max-width: 1023px) 100vw, 60vw"
              className="object-cover motion-safe:transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
            />
            {/* Elegant overlay for text */}
            <div className="absolute inset-0 bg-primary/10 transition-opacity group-hover:bg-primary/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-surface drop-shadow-md">
              <h3 className="mb-2 font-display text-display-md font-light tracking-wide">
                {featured.title}
              </h3>
              {featured.description ? (
                <p className="mx-auto max-w-md text-body-md font-light text-surface/90 drop-shadow-sm">
                  {featured.description}
                </p>
              ) : null}
            </div>
          </div>
        </Link>

        {secondary.length > 0 ? (
          <div
            className={cn(
              'grid gap-0 lg:col-span-5',
              secondary.length === 2 ? 'grid-rows-2' : 'grid-rows-1'
            )}
          >
            {secondary.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.handle}`}
                className="group flex flex-col relative overflow-hidden"
              >
                <div className="relative w-full flex-grow overflow-hidden aspect-square lg:h-full lg:aspect-auto bg-surface-soft">
                  <OptimizedImage
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 1023px) 100vw, 40vw"
                    className="object-cover motion-safe:transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-primary/10 transition-opacity group-hover:bg-primary/20" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-surface drop-shadow-md">
                    <h3 className="font-display text-display-sm font-light tracking-wide">
                      {collection.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {remaining.length > 0 ? (
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
          {remaining.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group flex flex-col relative overflow-hidden"
            >
              <div className="relative w-full flex-grow overflow-hidden aspect-[4/5] bg-surface-soft">
                <OptimizedImage
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 1023px) 100vw, 33vw"
                  className="object-cover motion-safe:transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-primary/10 transition-opacity group-hover:bg-primary/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-surface drop-shadow-md">
                  <h3 className="font-display text-display-sm font-light tracking-wide">
                    {collection.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
