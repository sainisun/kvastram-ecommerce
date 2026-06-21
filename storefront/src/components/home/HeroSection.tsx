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
      className="homepage-hero"
      aria-label="Featured campaigns"
      data-home-section="2-hero"
      onFocusCapture={() => autoplay.stop()}
      onBlurCapture={() => {
        if (!paused) autoplay.play();
      }}
    >
      <div className="homepage-hero-viewport" ref={emblaRef}>
        <div className="homepage-hero-track">
          {slides.map((slide, index) => (
            <article className="homepage-hero-slide" key={slide.id}>
              <picture>
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
              <div className="homepage-container homepage-hero-copy">
                <h1>{slide.title}</h1>
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
          <div className="homepage-hero-arrows">
            <IconButton
              type="button"
              variant="ghost"
              size="md"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous hero slide"
            >
              <ChevronLeft aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              variant="ghost"
              size="md"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next hero slide"
            >
              <ChevronRight aria-hidden="true" />
            </IconButton>
          </div>
          <div className="homepage-hero-controls">
            <div className="homepage-hero-dots">
              {slides.map((slide, index) => (
                <UnstyledButton
                  key={slide.id}
                  type="button"
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
