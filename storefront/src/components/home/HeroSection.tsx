'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { cloudinaryUrlOrNull } from '@/lib/media';

interface HeroBannerSlide {
  id: string;
  image_url?: string | null;
  mobile_image_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  button_link?: string | null;
}

interface HeroSectionProps {
  banners?: HeroBannerSlide[];
}

interface ResolvedSlide {
  id: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  alt: string;
  placeholderClass?: string;
}

export function HeroSection({ banners = [] }: HeroSectionProps) {
  const slides = useMemo<ResolvedSlide[]>(() => {
    const realSlides = banners
      .map((banner): ResolvedSlide => ({
        id: banner.id,
        imageUrl: cloudinaryUrlOrNull(banner.image_url) || undefined,
        mobileImageUrl: cloudinaryUrlOrNull(banner.mobile_image_url) || undefined,
        alt: banner.title?.trim() || banner.subtitle?.trim() || 'Kvastram hero',
      }))
      .filter((banner) => Boolean(banner.imageUrl));

    if (realSlides.length > 0) {
      return realSlides;
    }

    // Prototype placeholder slides with matching gradients
    return [
      {
        id: 'placeholder-kantha',
        alt: 'Kvastram Kantha placeholder hero',
        placeholderClass: 'bg-gradient-to-br from-[#2a1208] via-[#5c2a12] to-[#a85d3a]',
      },
      {
        id: 'placeholder-block-print',
        alt: 'Kvastram block print placeholder hero',
        placeholderClass: 'bg-gradient-to-br from-[#174f70] via-[#7a9b7f] to-[#d5b08a]',
      },
      {
        id: 'placeholder-occasion',
        alt: 'Kvastram occasion placeholder hero',
        placeholderClass: 'bg-gradient-to-br from-[#7f1d1d] via-[#c4956a] to-[#f4d4b8]',
      },
    ];
  }, [banners]);

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

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  return (
    <section
      className="hero relative block overflow-hidden"
      style={{ minHeight: 'min(70svh, 620px)', background: '#5c2a12' }}
    >
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div
          className="hero-slider flex"
          style={{ height: 'min(70svh, 620px)', minHeight: 420 }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={`hero-slide relative min-w-0 flex-[0_0_100%] ${slide.placeholderClass || ''}`}
              style={{ scrollSnapAlign: 'start', minHeight: '100%' }}
            >
              {slide.imageUrl ? (
                <div className="absolute inset-0">
                  {slide.mobileImageUrl ? (
                    <OptimizedImage
                      src={slide.mobileImageUrl}
                      alt={slide.alt}
                      fill
                      priority={slide.id === slides[0]?.id}
                      sizes="100vw"
                      className="object-cover object-center md:hidden"
                    />
                  ) : null}
                  <OptimizedImage
                    src={slide.imageUrl}
                    alt={slide.alt}
                    fill
                    priority={slide.id === slides[0]?.id}
                    sizes="100vw"
                    className={`object-cover object-center ${slide.mobileImageUrl ? 'hidden md:block' : ''}`}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Dots — prototype style */}
      <div className="hero-dots absolute left-0 right-0 bottom-4 flex justify-center gap-2" aria-hidden="true">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`hero-dot h-2 w-2 rounded-full transition-all ${
              selectedIndex === index ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
