'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';
export function CollectionSlider({ collections }: { collections: HomepageCollection[] }) {
  if (!collections || collections.length === 0) return null;

  return (
    <section
      className="w-full py-6 md:py-10"
      aria-label="Collection Slider"
      data-home-section="4-collection-slider"
    >
      <div className="homepage-container overflow-x-auto no-scrollbar flex gap-[10px] scroll-smooth">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.handle}`}
            className="relative flex-shrink-0 w-[65vw] md:w-[350px] aspect-[4/5] overflow-hidden group animate-fade-in"
          >
            <OptimizedImage
              src={collection.image}
              alt={collection.title}
              fill
              sizes="(max-width: 767px) 65vw, 350px"
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-105"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.5)] to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-[20px] w-full text-left">
              <h3 className="text-[var(--ds-text-inverse)] text-[18px] md:text-[22px] font-display font-medium tracking-wide">
                {collection.title}
              </h3>
              {collection.description && (
                <p className="text-[rgba(var(--ds-white-rgb),0.85)] text-body-xs type-regular mt-1 line-clamp-1">
                  {collection.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
