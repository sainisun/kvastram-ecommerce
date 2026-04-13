'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface HomepageCategory {
  id: string;
  image_url: string;
  name: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}

function CategoryCard({ category }: { category: HomepageCategory }) {
  return (
    <Link
      href={category.link_url}
      className="group relative h-[260px] w-[calc(50vw-1.5rem)] min-w-[150px] max-w-[220px] shrink-0 snap-start overflow-hidden rounded-[6px] bg-stone-200 sm:h-[320px] sm:w-[220px] md:h-[360px] md:w-[260px] md:max-w-[260px]"
    >
      <OptimizedImage
        src={category.image_url}
        alt={category.name}
        fill
        sizes="(max-width: 639px) 50vw, (max-width: 767px) 220px, 260px"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
        <p className="text-[15px] font-semibold uppercase tracking-[0.22em] sm:text-[16px] md:text-[18px]">
          {category.name}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/90 md:text-[11px]">
          EXPLORE COLLECTION
        </p>
      </div>
    </Link>
  );
}

export function CategorySection() {
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHomepageCategories() {
      try {
        const response = await api.getHomepageCategories();

        if (!cancelled) {
          setCategories(response.categories || []);
        }
      } catch (error) {
        console.error('Failed to load homepage categories:', error);
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHomepageCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || categories.length === 0) {
      return;
    }

    const updateActiveIndex = () => {
      const children = Array.from(track.children) as HTMLElement[];
      if (children.length === 0) {
        return;
      }

      const scrollLeft = track.scrollLeft;
      let nextIndex = 0;
      let smallestDistance = Number.POSITIVE_INFINITY;

      children.forEach((child, index) => {
        const distance = Math.abs(child.offsetLeft - scrollLeft);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          nextIndex = index;
        }
      });

      setActiveIndex(nextIndex);
    };

    updateActiveIndex();
    track.addEventListener('scroll', updateActiveIndex, { passive: true });

    return () => {
      track.removeEventListener('scroll', updateActiveIndex);
    };
  }, [categories]);

  useEffect(() => {
    if (categories.length <= 1) {
      return;
    }

    const track = trackRef.current;
    if (!track) {
      return;
    }

    if (typeof window === 'undefined' || window.innerWidth >= 768) {
      return;
    }

    const interval = window.setInterval(() => {
      const children = Array.from(track.children) as HTMLElement[];
      if (children.length === 0) {
        return;
      }

      const nextIndex = (activeIndex + 1) % children.length;
      track.scrollTo({
        left: children[nextIndex].offsetLeft,
        behavior: 'smooth',
      });
    }, 3500);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeIndex, categories.length]);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const nextCard = track?.children[index] as HTMLElement | undefined;

    if (!track || !nextCard) {
      return;
    }

    track.scrollTo({
      left: nextCard.offsetLeft,
      behavior: 'smooth',
    });
  }

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 md:px-8 md:py-14">
      <div className="mb-6 text-center md:mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Categories
        </h2>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:gap-5"
        >
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[260px] w-[calc(50vw-1.5rem)] min-w-[150px] max-w-[220px] shrink-0 animate-pulse rounded-[6px] bg-gray-200 sm:h-[320px] sm:w-[220px] md:h-[360px] md:w-[260px] md:max-w-[260px]"
                />
              ))
            : categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
        </div>

        {!loading && categories.length > 1 ? (
          <div className="mt-5 flex items-center justify-center gap-2">
            {categories.map((category, index) => (
              <button
                key={category.id}
                type="button"
                aria-label={`Go to category ${index + 1}`}
                onClick={() => scrollToIndex(index)}
                className={`h-2.5 rounded-full transition-all ${
                  activeIndex === index
                    ? 'w-6 bg-gray-900'
                    : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
