'use client';

import { useRef, useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface Testimonial {
  id: string;
  name: string;
  location?: string;
  content: string;
  rating?: number;
  avatar?: string;
  product_name?: string;
  date?: string;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
}

const CARD_WIDTH = 212; // 200px card + 12px gap

const STATIC_TESTIMONIALS: Testimonial[] = [
  {
    id: 's1',
    name: 'KANCHAN T.',
    content: 'This one is sooooo soft and the color is perfect. It fits like a dream and is now my favorite go-to piece.',
    product_name: 'Love Chess',
    date: '4 November 2023',
    rating: 5,
  },
  {
    id: 's2',
    name: 'JYOTI S.',
    content: 'Suta sarees are always comfortable to drape. Elegance and comfort in one single piece of fabric. Highly recommended.',
    product_name: 'Jaloka',
    date: '9 December 2023',
    rating: 5,
  },
  {
    id: 's3',
    name: 'PRIYA M.',
    content: 'The fabric quality is exceptional. I wore it for a wedding and received so many compliments on the detail.',
    product_name: 'Silk Tunic Set',
    date: '15 January 2024',
    rating: 5,
  },
  {
    id: 's4',
    name: 'REEMA K.',
    content: 'Excellent service and even better products. The packaging was also very premium. Will definitely shop again!',
    product_name: 'Organza Saree',
    date: '22 February 2024',
    rating: 5,
  },
];

export function Testimonials({ testimonials }: TestimonialsProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const items = testimonials.length > 0 ? testimonials : STATIC_TESTIMONIALS;

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

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <section className="py-16 bg-white overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-10 px-4">
        <div className="h-px w-[60px] bg-zinc-200" />
        <h3 className="text-[13px] font-normal tracking-[3px] uppercase text-black font-body">
          CUSTOMER TESTIMONIALS
        </h3>
        <div className="h-px w-[60px] bg-zinc-200" />
      </div>

      <div className="relative px-4">
        {/* Prev button */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={atStart}
          className="absolute left-2 top-[110px] -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-black bg-white flex items-center justify-center text-black transition-opacity disabled:opacity-30"
          aria-label="Previous testimonials"
        >
          <span className="text-[14px]">❮</span>
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={scrollNext}
          disabled={atEnd}
          className="absolute right-2 top-[110px] -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-black bg-white flex items-center justify-center text-black transition-opacity disabled:opacity-30"
          aria-label="Next testimonials"
        >
          <span className="text-[14px]">❯</span>
        </button>

        {/* Carousel */}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-4"
        >
          {items.map((t) => {
            const isExpanded = expanded.has(t.id);
            return (
              <div
                key={t.id}
                className="min-w-[200px] w-[200px] flex-shrink-0 snap-start bg-white border border-zinc-200 overflow-hidden flex flex-col"
              >
                {t.avatar && (
                  <div className="relative w-full" style={{ height: '220px' }}>
                    <OptimizedImage
                      src={t.avatar}
                      alt={t.name}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                )}
                {!t.avatar && (
                  <div className="w-full bg-zinc-100 flex items-center justify-center" style={{ height: '120px' }}>
                    <span className="text-3xl text-zinc-300">★★★★★</span>
                  </div>
                )}

                <div className="p-[14px] flex flex-col gap-3">
                  <div className="relative">
                    <p
                      className={`text-[12px] text-zinc-700 leading-[1.6] transition-all duration-300 ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {t.content}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleExpand(t.id)}
                      className="text-[11px] font-bold text-black underline mt-1 block"
                    >
                      {isExpanded ? '... read less' : '... read more'}
                    </button>
                  </div>
                  <div className="h-px w-full bg-zinc-100" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase text-black tracking-[1px]">
                      {t.name}
                    </span>
                    {t.date && (
                      <span className="text-[10px] italic text-zinc-400">{t.date}</span>
                    )}
                    {t.product_name && (
                      <span className="text-[11px] text-zinc-700">{t.product_name}</span>
                    )}
                    <div className="text-[12px] text-black tracking-tight">
                      {'★'.repeat(t.rating ?? 5)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* End spacer */}
          <div className="min-w-[16px] flex-shrink-0" />
        </div>
      </div>
    </section>
  );
}
