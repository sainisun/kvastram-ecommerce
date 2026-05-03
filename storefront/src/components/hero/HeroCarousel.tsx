'use client';

import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * HeroCarousel Component
 *
 * Implements a full-screen carousel using Embla Carousel.
 * Slides come from admin-managed banners (section='hero') via API.
 */

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link?: string;
  button_text?: string;
  section?: string;
}

interface HeroCarouselProps {
  banners?: Banner[];
}

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 60 }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const slides =
    banners?.map((b) => ({
      id: b.id,
      image: b.image_url,
      title: b.title,
      ctaText: b.button_text || '',
      ctaLink: b.link || '/products',
    })) || [];

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative group overflow-hidden bg-stone-900 border-b border-stone-800">
      {/* Carousel Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div
              className="relative flex-[0_0_100%] min-w-0 h-[85vh] min-h-[600px] flex flex-col md:flex-row"
              key={slide.id}
            >
              {/* Left Content Half (Dark Editorial) */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full bg-[#1a1614] flex items-center justify-center p-8 md:p-16 lg:p-24 z-10">
                <div className="max-w-xl w-full animate-fade-in-up">
                  <span className="text-amber-500 text-body-xs md:text-body-sm type-bold tracking-token-wider uppercase mb-4 md:mb-6 block">
                    Kvastram Collection
                  </span>

                  <h1 className="text-display-xl md:text-display-xl lg:text-display-xl font-serif text-white mb-6 leading-token-tight whitespace-pre-line">
                    {slide.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4">
                    {slide.ctaText ? (
                      <Link
                        href={slide.ctaLink}
                        className="bg-white text-stone-900 px-8 py-4 text-body-xs type-bold uppercase tracking-token-wider hover:bg-stone-200 transition-colors shadow-xl"
                      >
                        {slide.ctaText}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right Image Half */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-stone-100 overflow-hidden">
                <OptimizedImage
                  src={slide.image}
                  alt={slide.title.replace('\n', ' ')}
                  fill
                  className="object-cover transition-transform duration-[10000ms] ease-linear hover:scale-105"
                  priority={index === 0}
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a1614]/40 via-transparent to-transparent hidden md:block" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm flex items-center justify-center hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 duration-300 hidden md:flex"
        onClick={scrollPrev}
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm flex items-center justify-center hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 duration-300 hidden md:flex"
        onClick={scrollNext}
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block z-10">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white to-transparent opacity-50"></div>
      </div>
    </div>
  );
}

