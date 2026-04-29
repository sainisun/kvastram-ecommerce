'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { cloudinaryUrlOrNull } from '@/lib/media';

interface HeroBannerSlide {
  id: string;
  image_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  button_link?: string | null;
}

interface HomepageSettings {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_cta_text?: string | null;
  hero_cta_link?: string | null;
  hero_image?: string | null;
}

interface HeroSectionProps {
  settings: HomepageSettings;
  banners?: HeroBannerSlide[];
}

interface ResolvedSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  isFallback: boolean;
}

export function HeroSection({ settings, banners = [] }: HeroSectionProps) {
  const slides = useMemo<ResolvedSlide[]>(() => {
    const validBanners = banners
      .map((banner) => ({
        id: banner.id,
        imageUrl: cloudinaryUrlOrNull(banner.image_url),
        title: banner.title?.trim() || '',
        subtitle: banner.subtitle?.trim() || '',
        ctaText: banner.button_text?.trim() || '',
        ctaLink: banner.button_link?.trim() || '/products',
        isFallback: false,
      }))
      .filter((banner): banner is ResolvedSlide => Boolean(banner.imageUrl));

    if (validBanners.length > 0) {
      return validBanners;
    }

    return [
      {
        id: 'hero-settings-fallback',
        imageUrl:
          cloudinaryUrlOrNull(settings.hero_image) || '/images/home/hero-main.jpg',
        title: settings.hero_title?.trim() || '',
        subtitle: settings.hero_subtitle?.trim() || 'Handcrafted in Jaipur, India',
        ctaText: settings.hero_cta_text?.trim() || 'Shop the Collection',
        ctaLink: settings.hero_cta_link?.trim() || '/products',
        isFallback: true,
      },
    ];
  }, [banners, settings]);

  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    []
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1 }, [autoplay]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const syncSelection = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    syncSelection();
    emblaApi.on('select', syncSelection);
    emblaApi.on('reInit', syncSelection);

    return () => {
      emblaApi.off('select', syncSelection);
      emblaApi.off('reInit', syncSelection);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  return (
    <section
      data-hero-slider
      className="group relative h-[70vh] min-h-[480px] overflow-hidden lg:h-[85vh] lg:min-h-[600px]"
    >
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => {
            return (
              <div
                key={slide.id}
                data-hero-slide
                className="relative h-full min-w-0 flex-[0_0_100%]"
              >
                <div className="absolute inset-0">
                  <OptimizedImage
                    src={slide.imageUrl}
                    alt={slide.title || 'Kvastram hero'}
                    fill
                    priority={slide.id === slides[0]?.id}
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                </div>

                {(slide.isFallback || slide.title || slide.subtitle || slide.ctaText) && (
                  <div className="absolute inset-0">
                    <div className="mx-auto flex h-full max-w-[1440px] items-end px-6 pb-12 pt-16 md:px-12 md:pb-16 lg:px-20 lg:pb-24">
                      <div className="max-w-2xl text-left">
                        {slide.subtitle && (
                          <div className="text-[11px] uppercase tracking-[0.25em] text-white drop-shadow-sm">
                            {slide.subtitle}
                          </div>
                        )}

                        {slide.title ? (
                          <h1 className="mt-4 max-w-3xl font-heading text-[clamp(42px,9vw,84px)] font-normal leading-[0.94] tracking-[-0.03em] text-white drop-shadow-sm">
                            {slide.title}
                          </h1>
                        ) : slide.isFallback ? (
                          <h1 className="mt-4 max-w-3xl font-heading text-[clamp(42px,9vw,84px)] font-normal leading-[0.94] tracking-[-0.03em] text-white drop-shadow-sm">
                            Made by hand.
                            <br />
                            Carried <em className="italic">across the world.</em>
                          </h1>
                        ) : null}

                        {(slide.title || slide.isFallback) && (
                          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/90 drop-shadow-sm sm:text-[17px] sm:leading-8">
                            Kantha quilts, block-printed clothing and artisan bags, each piece
                            hand-stitched by skilled women in Jaipur. Ships to 50+ countries.
                          </p>
                        )}

                        {(slide.ctaText || slide.isFallback) && (
                          <div className="mt-8 flex flex-wrap gap-4">
                            {(slide.ctaText || slide.isFallback) && (
                              <Link
                                href={slide.ctaLink}
                                className="inline-flex items-center justify-center bg-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-stone-200 sm:px-8 sm:py-4 sm:text-[12px]"
                              >
                                {slide.ctaText || 'Shop the Collection'}
                              </Link>
                            )}
                            {slide.isFallback && (
                              <Link
                                href="/about"
                                className="inline-flex items-center justify-center border border-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:bg-white hover:text-black sm:px-8 sm:py-4 sm:text-[12px]"
                              >
                                Our Story
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous slide"
            className="absolute left-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-black md:flex md:opacity-0 md:group-hover:opacity-100 lg:left-20"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next slide"
            className="absolute right-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-black md:flex md:opacity-0 md:group-hover:opacity-100 lg:right-20"
          >
            <ChevronRight size={20} />
          </button>
        </>
      ) : null}

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            data-hero-dot
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              selectedIndex === index ? 'w-7 bg-white' : 'w-7 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
