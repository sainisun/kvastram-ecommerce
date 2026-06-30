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
      className="overflow-hidden border-b border-border-subtle bg-[var(--ds-surface-paper)]"
      aria-labelledby="homepage-circles-title"
      data-home-section="1-circle-categories"
    >
      <h2 id="homepage-circles-title" className="sr-only">
        Shop by category
      </h2>
      <div
        ref={rowRef}
        className="homepage-container flex gap-[var(--ds-space-md)] overflow-x-auto py-[var(--ds-space-md)] [scroll-padding-inline:var(--homepage-gutter)] snap-x snap-mandatory no-scrollbar [&::-webkit-scrollbar]:hidden min-[1100px]:justify-center min-[1100px]:gap-[var(--ds-space-md)]"
      >
        {circles.map((circle, index) => (
          <Link
            key={circle.id}
            ref={(element) => {
              linksRef.current[index] = element;
            }}
            href={circle.link_url.replace('/categories/', '/collections/')}
            className="homepage-circle-link grid flex-[0_0_88px] md:basis-[108px] gap-2 text-primary text-body-xs text-center no-underline snap-center focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ds-accent-primary)] focus-visible:outline-offset-4"
            data-circle-index={index}
          >
            <span className="relative block aspect-square overflow-hidden border border-border-subtle rounded-full bg-surface-soft">
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
