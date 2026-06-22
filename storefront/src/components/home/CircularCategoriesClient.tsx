'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCircle } from '@/types/homepage';

export function CircularCategoriesClient({
  circles,
}: {
  circles: HomepageCategoryCircle[];
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const linksRef = useRef<Array<HTMLAnchorElement | null>>([]);

  const focusCircle = useCallback((index: number, direction: 1 | -1) => {
    const nextIndex = (index + direction + circles.length) % circles.length;
    const nextLink = linksRef.current[nextIndex];
    nextLink?.focus({ preventScroll: true });
    nextLink?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    });
  }, [circles.length]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const keyboardRow = row;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const target = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('.homepage-circle-link')
        : null;
      if (!target || !keyboardRow.contains(target)) return;

      const activeIndex = Number.parseInt(target.dataset.circleIndex || '', 10);
      if (!Number.isFinite(activeIndex)) return;

      event.preventDefault();
      focusCircle(activeIndex, event.key === 'ArrowRight' ? 1 : -1);
    }

    keyboardRow.addEventListener('keydown', handleKeyDown);
    keyboardRow.setAttribute('data-keyboard-ready', 'true');

    return () => {
      keyboardRow.removeEventListener('keydown', handleKeyDown);
      keyboardRow.removeAttribute('data-keyboard-ready');
    };
  }, [focusCircle]);

  return (
    <section
      className="homepage-circles"
      aria-labelledby="homepage-circles-title"
      data-home-section="1-circle-categories"
    >
      <h2 id="homepage-circles-title" className="sr-only">
        Shop by category
      </h2>
      <div
        ref={rowRef}
        className="homepage-container homepage-circle-row no-scrollbar"
      >
        {circles.map((circle, index) => (
          <Link
            key={circle.id}
            ref={(element) => {
              linksRef.current[index] = element;
            }}
            href={circle.link_url.replace('/categories/', '/collections/')}
            className="homepage-circle-link"
            data-circle-index={index}
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
