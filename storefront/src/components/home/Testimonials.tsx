'use client';

import { useRef, useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTestimonial } from '@/types/homepage';

interface TestimonialsProps {
  testimonials: HomepageTestimonial[];
}

const CARD_WIDTH = 376;

export function Testimonials({ testimonials }: TestimonialsProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  if (testimonials.length === 0) return null;

  function handleScroll() {
    const el = carouselRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 10);
    setAtEnd(el.scrollLeft + el.offsetWidth >= el.scrollWidth - 10);
  }

  function scrollNext() {
    carouselRef.current?.scrollBy({ left: CARD_WIDTH, behavior: 'smooth' });
  }

  function scrollPrev() {
    carouselRef.current?.scrollBy({ left: -CARD_WIDTH, behavior: 'smooth' });
  }

  return (
    <section className="bg-[#f8f5f1] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              Customer Testimonials
            </p>
            <h2 className="font-heading text-[32px] font-semibold leading-[0.98] text-stone-950 sm:text-[40px] lg:text-[48px]">
              What shoppers already love
            </h2>
            <p className="max-w-2xl text-[15px] font-[300] leading-7 text-stone-600">
              Real storefront testimonials, reworked into a more premium and
              readable carousel without changing the source data.
            </p>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={atStart}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-800 transition-colors hover:border-stone-950 disabled:opacity-40"
              aria-label="Previous testimonials"
            >
              <span className="text-lg">‹</span>
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={atEnd}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-800 transition-colors hover:border-stone-950 disabled:opacity-40"
              aria-label="Next testimonials"
            >
              <span className="text-lg">›</span>
            </button>
          </div>
        </div>

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex gap-5 overflow-x-auto pb-2 scroll-smooth no-scrollbar snap-x snap-mandatory"
        >
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="flex min-h-[300px] w-[88vw] shrink-0 snap-start flex-col justify-between rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:w-[380px] sm:p-6 lg:w-[420px]"
            >
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  {testimonial.avatar_url ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-full bg-stone-100">
                      <OptimizedImage
                        src={testimonial.avatar_url}
                        alt={testimonial.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-lg font-semibold uppercase text-stone-500">
                      {testimonial.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-[15px] font-semibold uppercase tracking-[0.08em] text-stone-900">
                      {testimonial.name}
                    </p>
                    {testimonial.location ? (
                      <p className="text-[12px] uppercase tracking-[0.14em] text-stone-500">
                        {testimonial.location}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[14px] text-amber-500">
                  {'★'.repeat(Math.max(1, testimonial.rating ?? 5))}
                </div>

                <p className="text-[15px] font-[300] leading-7 text-stone-700 sm:text-[16px] sm:leading-8">
                  {testimonial.content}
                </p>
              </div>

              <div className="mt-8 border-t border-stone-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Verified Homepage Testimonial
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
