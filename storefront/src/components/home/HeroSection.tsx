'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { ButtonLink, HomepageContainer, IconButton, OptimizedImage, UnstyledButton } from '@/design-system';
import type { HomepageHeroSlide } from '@/types/homepage';

export function HeroSection({ banners }: { banners: HomepageHeroSlide[] }) {
  const slides = banners.slice(0, 4);
  const [paused, setPaused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => {
      mediaQuery.removeEventListener('change', syncViewport);
    };
  }, []);

  const toggleAutoplay = useCallback(() => {
    if (paused) autoplay.play();
    else autoplay.stop();
    setPaused((current) => !current);
  }, [autoplay, paused]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative h-[clamp(520px,76svh,820px)] overflow-hidden bg-primary"
      aria-label="Featured campaigns"
      data-home-section="2-hero"
      onFocusCapture={() => autoplay.stop()}
      onBlurCapture={() => {
        if (!paused) autoplay.play();
      }}
    >
      <div className="h-[clamp(520px,76svh,820px)] overflow-hidden" ref={emblaRef}>
        <div className="flex h-[clamp(520px,76svh,820px)]">
          {slides.map((slide, index) => (
            <article className="relative h-[clamp(520px,76svh,820px)] min-w-0 flex-[0_0_100%]" key={slide.id}>
              <div className="absolute inset-0">
                <OptimizedImage
                  src={isMobileViewport && slide.mobile_image_url ? slide.mobile_image_url : slide.image_url}
                  alt=""
                  fill
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(var(--ds-black-rgb),0.68)] to-[rgba(var(--ds-black-rgb),0.08)_70%]" />
              <HomepageContainer className="relative z-10 flex h-[clamp(520px,76svh,820px)] flex-col items-start justify-end gap-6 pb-[clamp(76px,10vw,132px)] text-inverse">
                <p className="m-0 max-w-[15ch] font-display text-display-xl font-normal text-inverse">
                  {slide.title}
                </p>
                <ButtonLink href={slide.button_link} variant="secondary" size="lg">
                  {slide.button_text}
                </ButtonLink>
              </HomepageContainer>
            </article>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <div className="pointer-events-none absolute inset-x-[var(--ds-home-gutter-mobile)] top-1/2 z-[2] flex justify-between md:inset-x-[var(--ds-home-gutter-tablet)] lg:inset-x-[var(--ds-home-gutter-desktop)]">
            <IconButton
              type="button"
              variant="ghost"
              size="md"
              className="pointer-events-auto border-[rgba(var(--ds-white-rgb),0.48)] bg-[rgba(var(--ds-ink-rgb),0.4)] text-inverse backdrop-blur-md"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous hero slide"
            >
              <ChevronLeft aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              variant="ghost"
              size="md"
              className="pointer-events-auto border-[rgba(var(--ds-white-rgb),0.48)] bg-[rgba(var(--ds-ink-rgb),0.4)] text-inverse backdrop-blur-md"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next hero slide"
            >
              <ChevronRight aria-hidden="true" />
            </IconButton>
          </div>
          <div className="absolute bottom-6 right-[var(--ds-home-gutter-mobile)] z-[2] flex items-center gap-[var(--ds-space-sm)] md:right-[var(--ds-home-gutter-tablet)] lg:right-[var(--ds-home-gutter-desktop)]">
            <div className="flex gap-[var(--ds-space-xs)]">
              {slides.map((slide, index) => (
                <UnstyledButton
                  key={slide.id}
                  type="button"
                  className="min-h-[var(--ds-control-sm)] min-w-[var(--ds-control-sm)] rounded-full bg-[rgba(var(--ds-white-rgb),0.16)] px-0 aria-[current=true]:bg-inverse transition-colors duration-150"
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
              className="pointer-events-auto border-[rgba(var(--ds-white-rgb),0.48)] bg-[rgba(var(--ds-ink-rgb),0.4)] text-inverse backdrop-blur-md"
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
