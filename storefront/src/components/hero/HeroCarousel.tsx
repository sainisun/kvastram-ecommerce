'use client';

import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
/**
 * HeroCarousel Component
 *
 * Implements a full-screen or high-height carousel using Embla Carousel to mimic the Spell.co aesthetic.
 * Features 3 slides with immersive imagery, text overlays, and call-to-action buttons.
 * Optimized for mobile with touch swipe support.
 */

const SLIDES = [
  {
    id: 1,
    image: '/images/home/hero-main.jpg',
    subtitle: 'Artisan Crafted Since 1985',
    title: 'Where Tradition \nMeets Modern',
    description:
      'Discover handcrafted elegance from master artisans in India and Italy. Each piece tells a story of generations of expertise.',
    ctaText: 'Shop New Arrivals',
    ctaLink: '/products',
    position: 'center', // text alignment
  },
  {
    id: 2,
    image: '/images/home/category-sarees.jpg', // Fallback or reuse
    subtitle: 'The Silk Road Collection',
    title: 'Timeless \nElegance',
    description:
      'Exquisite silk sarees hand-woven in Varanasi. A tribute to the golden era of craftsmanship.',
    ctaText: 'View Collection',
    ctaLink: '/products?category_id=sarees',
    position: 'left',
  },
  {
    id: 3,
    image: '/images/home/collection-bridal.jpg', // Fallback or reuse
    subtitle: 'Bridal Edit 2025',
    title: 'Your Moment \nIn History',
    description:
      'Intricate embroidery and luxurious fabrics for the most important day of your life.',
    ctaText: 'Explore Bridal',
    ctaLink: '/collections/bridal',
    position: 'right',
  },
];

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 60 }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative group overflow-hidden bg-stone-900 border-b border-stone-800">
      {/* Carousel Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {SLIDES.map((slide, index) => (
            <div
              className="relative flex-[0_0_100%] min-w-0 h-[85vh] min-h-[600px] flex flex-col md:flex-row"
              key={slide.id}
            >
              {/* Left Content Half (Dark Editorial) */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full bg-[#1a1614] flex items-center justify-center p-8 md:p-16 lg:p-24 z-10">
                <div className="max-w-xl w-full animate-fade-in-up">
                  <span className="text-amber-500 text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4 md:mb-6 block">
                    {slide.subtitle}
                  </span>

                  <h1 className="text-4xl md:text-6xl lg:text-[5.5rem] font-serif text-white mb-6 leading-[1.05] whitespace-pre-line">
                    {slide.title}
                  </h1>

                  <p className="text-stone-300 text-base md:text-lg mb-8 md:mb-12 font-light max-w-md leading-relaxed">
                    {slide.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href={slide.ctaLink}
                      className="bg-white text-stone-900 px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors shadow-xl"
                    >
                      {slide.ctaText}
                    </Link>
                    <Link
                      href="/collections"
                      className="bg-transparent text-white border border-stone-600 px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
                    >
                      Secondary Action
                    </Link>
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
                {/* Subtle gradient overlay to merge image with center split on desktop */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a1614]/40 via-transparent to-transparent hidden md:block" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons (Hidden on mobile, visible on hover/desktop) */}
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
