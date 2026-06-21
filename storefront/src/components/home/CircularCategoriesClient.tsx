'use client';

import Link from 'next/link';
import { useRef } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCircle } from '@/types/homepage';

export function CircularCategoriesClient({
  circles,
}: {
  circles: HomepageCategoryCircle[];
}) {
  const linksRef = useRef<Array<HTMLAnchorElement | null>>([]);

  function focusCircle(index: number, direction: 1 | -1) {
    const nextIndex = (index + direction + circles.length) % circles.length;
    const nextLink = linksRef.current[nextIndex];
    nextLink?.focus({ preventScroll: true });
    nextLink?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const target = event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>('.homepage-circle-link')
      : null;
    const activeIndex = linksRef.current.findIndex((link) => link === target);
    if (activeIndex < 0) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    focusCircle(activeIndex, direction);
  }

  function handleLinkKeyDown(
    event: React.KeyboardEvent<HTMLAnchorElement>,
    index: number
  ) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    event.stopPropagation();
    focusCircle(index, event.key === 'ArrowRight' ? 1 : -1);
  }

  return (
    <section
      className="homepage-circles"
      aria-labelledby="homepage-circles-title"
      data-home-section="1-categories"
    >
      <h2 id="homepage-circles-title" className="sr-only">
        Shop by category
      </h2>
      <div
        className="homepage-container homepage-circle-row"
        onKeyDown={handleRowKeyDown}
      >
        {circles.map((circle, index) => (
          <Link
            key={circle.id}
            ref={(element) => {
              linksRef.current[index] = element;
            }}
            href={circle.link_url}
            className="homepage-circle-link"
            onKeyDown={(event) => handleLinkKeyDown(event, index)}
          >
            <span className="homepage-circle-media">
              <OptimizedImage
                src={circle.image_url || ''}
                alt=""
                fill
                sizes="(max-width: 767px) 88px, 108px"
                className="object-cover"
              />
            </span>
            <span>{circle.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
