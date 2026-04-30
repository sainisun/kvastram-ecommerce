'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

interface HeroSectionProps {
  banners?: HeroBannerSlide[];
}

interface ResolvedSlide {
  id: string;
  imageUrl: string;
  alt: string;
}

export function HeroSection({ banners = [] }: HeroSectionProps) {
  const slides = useMemo<ResolvedSlide[]>(() => {
    return banners
      .map((banner) => ({
        id: banner.id,
        imageUrl: cloudinaryUrlOrNull(banner.image_url),
        alt: banner.title?.trim() || banner.subtitle?.trim() || 'Kvastram hero',
      }))
      .filter((banner): banner is ResolvedSlide => Boolean(banner.imageUrl));
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

  if (slides.length === 0) {
    return null;
  }

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
                    alt={slide.alt}
                    fill
                    priority={slide.id === slides[0]?.id}
                    sizes="100vw"
                    className="object-cover object-center"
                  />
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
