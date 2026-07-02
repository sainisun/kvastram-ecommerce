'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCard } from '@/types/homepage';

export function CategoryCarousel({ categories }: { categories: HomepageCategoryCard[] }) {
  if (categories.length === 0) return null;

  return (
    <section
      className="w-full py-[var(--ds-home-section-space-mobile)] md:py-[var(--ds-home-section-space-desktop)]"
      aria-labelledby="homepage-category-carousel-title"
      data-home-section="3-category-carousel"
    >
      <div className="homepage-container">
        <h2
          id="homepage-category-carousel-title"
          className="mb-[var(--ds-space-md)] font-display text-display-lg text-primary text-center"
        >
          shop by category
        </h2>
        <div className="overflow-x-auto no-scrollbar flex gap-[5px] scroll-smooth">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.link_url.replace('/categories/', '/collections/')}
              className="relative flex-shrink-0 w-[70vw] md:w-[314px] aspect-[2/3] overflow-hidden group animate-fade-in"
            >
              <OptimizedImage
                src={category.image_url}
                alt={category.name}
                fill
                sizes="(max-width: 767px) 70vw, 314px"
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-105"
              />
              {/* Soft gradient overlay for text readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.4)] to-transparent" />

              <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 text-center w-full px-[10px]">
                <span className="inline-block text-inverse text-[14px] font-ui font-medium uppercase tracking-[var(--ds-type-label-tracking)]">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
