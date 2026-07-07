'use client';

import Link from 'next/link';
import {
  HomepageSection,
  HomepageSectionHeader,
  OptimizedImage,
  homepageScrollRailClassName,
} from '@/design-system';
import type { HomepageCategoryCard } from '@/types/homepage';

export function CategoryCarousel({ categories }: { categories: HomepageCategoryCard[] }) {
  if (categories.length === 0) return null;

  return (
    <HomepageSection
      aria-labelledby="homepage-category-carousel-title"
      data-home-section="3-category-carousel"
    >
      <HomepageSectionHeader
        heading="Shop by category"
        headingId="homepage-category-carousel-title"
        align="center"
      />

      <div className={`${homepageScrollRailClassName} gap-[var(--ds-space-2xs)]`}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.link_url.replace('/categories/', '/collections/')}
            className="group relative block w-[70vw] flex-shrink-0 overflow-hidden aspect-[2/3] animate-fade-in md:w-[314px]"
          >
            <OptimizedImage
              src={category.image_url}
              alt={category.name}
              fill
              sizes="(max-width: 767px) 70vw, 314px"
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.4)] to-transparent" />

            <div className="absolute bottom-[10px] left-1/2 w-full -translate-x-1/2 px-[10px] text-center">
              <span className="inline-block font-ui text-[14px] font-medium uppercase tracking-[var(--ds-type-label-tracking)] text-inverse">
                {category.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </HomepageSection>
  );
}
