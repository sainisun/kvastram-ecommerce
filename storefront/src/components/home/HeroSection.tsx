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
}

export function HeroSection({ settings, banners = [] }: HeroSectionProps) {
  const slides = useMemo<ResolvedSlide[]>(() => {
    const validBanners = banners
      .map((banner) => ({
        id: banner.id,
        imageUrl: cloudinaryUrlOrNull(banner.image_url),
        title: banner.title?.trim() || settings.hero_title?.trim() || '',
        subtitle:
          banner.subtitle?.trim() ||
          settings.hero_subtitle?.trim() ||
          'Handcrafted in Jaipur, India',
        ctaText:
          banner.button_text?.trim() ||
          settings.hero_cta_text?.trim() ||
          'Shop the Collection',
        ctaLink: banner.button_link?.trim() || settings.hero_cta_link?.trim() || '/products',
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
      className="group relative h-[calc(100svh-73px)] overflow-hidden md:h-[90vh] md:min-h-[600px]"
    >
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => {
            const hasCustomTitle = Boolean(slide.title);

            return (
              <div
                key={slide.id}
                data-hero-slide
                className="relative h-full min-w-0 flex-[0_0_100%]"
              >
                <div className="absolute inset-0">
                  <OptimizedImage
                    src={slide.imageUrl}
                    alt={hasCustomTitle ? slide.title : 'Kvastram hero'}
                    fill
                    priority={slide.id === slides[0]?.id}
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(0,0,0,0.3),transparent_70%),linear-gradient(to_right,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.12)_60%)]" />

                <div className="absolute inset-0">
                  <div className="mx-auto flex h-full max-w-[1280px] items-end px-4 pb-20 pt-28 sm:px-6 sm:pb-24 lg:px-8 lg:pb-16">
                    <div className="max-w-2xl text-left">
                      <div className="text-[11px] uppercase tracking-[0.25em] text-white">
                        {slide.subtitle}
                      </div>

                      {hasCustomTitle ? (
                        <h1 className="mt-5 max-w-3xl font-heading text-[clamp(42px,9vw,84px)] font-normal leading-[0.94] tracking-[-0.03em] text-white">
                          {slide.title}
                        </h1>
                      ) : (
                        <h1 className="mt-5 max-w-3xl font-heading text-[clamp(42px,9vw,84px)] font-normal leading-[0.94] tracking-[-0.03em] text-white">
                          Made by hand.
                          <br />
                          Carried <em className="italic">across the world.</em>
                        </h1>
                      )}

                      <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/92 sm:text-[17px] sm:leading-8">
                        Kantha quilts, block-printed clothing and artisan bags, each piece
                        hand-stitched by skilled women in Jaipur. Ships to 50+ countries.
                      </p>

                      <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                        <Link
                          href={slide.ctaLink}
                          className="inline-flex items-center justify-center bg-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-stone-200 sm:px-8 sm:py-4 sm:text-[12px]"
                        >
                          {slide.ctaText}
                        </Link>
                        <Link
                          href="/about"
                          className="inline-flex items-center justify-center border border-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:bg-white hover:text-black sm:px-8 sm:py-4 sm:text-[12px]"
                        >
                          Our Story
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
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
            className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-black md:flex md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-black md:flex md:opacity-0 md:group-hover:opacity-100"
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
