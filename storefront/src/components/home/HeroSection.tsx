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

    return [
      {
        id: 'placeholder-kantha',
        alt: 'Kvastram Kantha placeholder hero',
        placeholderClass: 'from-[#a85d3a] via-[#c4956a] to-[#f4d4b8]',
      },
      {
        id: 'placeholder-block-print',
        alt: 'Kvastram block print placeholder hero',
        placeholderClass: 'from-[#174f70] via-[#7a9b7f] to-[#d5b08a]',
      },
      {
        id: 'placeholder-occasion',
        alt: 'Kvastram occasion placeholder hero',
        placeholderClass: 'from-[#7f1d1d] via-[#c4956a] to-[#f4d4b8]',
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
      data-hero-slider
      className="relative min-h-[420px] overflow-hidden md:min-h-[560px] lg:min-h-[min(70vh,620px)]"
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
                  {slide.imageUrl ? (
                    <>
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
                    </>
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-br ${slide.placeholderClass}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
