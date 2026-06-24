'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ButtonLink, IconButton, UnstyledButton } from '@/components/ui/Button';
import type { HomepageHeroSlide } from '@/types/homepage';

export function HeroSection({ banners }: { banners: HomepageHeroSlide[] }) {
  const slides = banners.slice(0, 4);
  const [paused, setPaused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const autoplay = useMemo(
    () => Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true }),
    []
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: slides.length > 1, watchDrag: slides.length > 1 },
    [autoplay]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const select = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    select();
    emblaApi.on('select', select);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) {
      autoplay.stop();
      setPaused(true);
    }
    return () => {
      emblaApi.off('select', select);
    };
  }, [autoplay, emblaApi]);

  const toggleAutoplay = useCallback(() => {
    if (paused) autoplay.play();
    else autoplay.stop();
    setPaused((current) => !current);
  }, [autoplay, paused]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative min-h-[clamp(520px,76svh,820px)] overflow-hidden bg-[var(--ds-text-primary)]"
      aria-label="Featured campaigns"
      data-home-section="2-hero"
      onFocusCapture={() => autoplay.stop()}
      onBlurCapture={() => {
        if (!paused) autoplay.play();
      }}
    >
      <div className="min-h-[inherit] overflow-hidden" ref={emblaRef}>
        <div className="flex min-h-[inherit]">
          {slides.map((slide, index) => (
            <article className="relative flex-[0_0_100%] min-w-0 min-h-[inherit]" key={slide.id}>
              <picture className="absolute inset-0">
                {slide.mobile_image_url ? (
                  <source media="(max-width: 767px)" srcSet={slide.mobile_image_url} />
                ) : null}
                <OptimizedImage
                  src={slide.image_url}
                  alt=""
                  fill
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  className="object-cover"
                />
              </picture>
              <div className="homepage-hero-scrim" />
              <div className="homepage-container relative z-10 flex min-h-[inherit] flex-col items-start justify-end gap-6 pb-[clamp(76px,10vw,132px)] text-[var(--ds-text-inverse)]">
                <h1 className="max-w-[15ch] m-0 text-[var(--ds-text-inverse)] font-display text-display-xl font-normal">{slide.title}</h1>
                <ButtonLink href={slide.button_link} variant="secondary" size="lg">
                  {slide.button_text}
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <div className="absolute inset-x-[var(--homepage-gutter)] top-1/2 z-[2] flex justify-between pointer-events-none">
            <IconButton
              type="button"
              variant="ghost"
              size="md"
              className="border-[rgba(var(--ds-white-rgb),0.48)] bg-[rgba(var(--ds-black-rgb),0.28)] text-[var(--ds-text-inverse)] backdrop-blur-md pointer-events-auto"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous hero slide"
            >
              <ChevronLeft aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              variant="ghost"
              size="md"
              className="border-[rgba(var(--ds-white-rgb),0.48)] bg-[rgba(var(--ds-black-rgb),0.28)] text-[var(--ds-text-inverse)] backdrop-blur-md pointer-events-auto"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next hero slide"
            >
              <ChevronRight aria-hidden="true" />
            </IconButton>
          </div>
          <div className="absolute right-[var(--homepage-gutter)] bottom-6 z-[2] flex items-center gap-4">
            <div className="flex gap-2">
              {slides.map((slide, index) => (
                <UnstyledButton
                  key={slide.id}
                  type="button"
                  className="w-[28px] h-[3px] bg-[rgba(var(--ds-white-rgb),0.45)] aria-[current=true]:bg-[var(--ds-text-inverse)] transition-colors duration-150"
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Go to hero slide ${index + 1}`}
                  aria-current={selectedIndex === index ? 'true' : undefined}
                />
              ))}
            </div>
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              className="border-[rgba(var(--ds-white-rgb),0.48)] bg-[rgba(var(--ds-black-rgb),0.28)] text-[var(--ds-text-inverse)] backdrop-blur-md pointer-events-auto"
              onClick={toggleAutoplay}
              aria-label={paused ? 'Play hero slideshow' : 'Pause hero slideshow'}
            >
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </IconButton>
          </div>
        </>
      ) : null}
    </section>
  );
}
