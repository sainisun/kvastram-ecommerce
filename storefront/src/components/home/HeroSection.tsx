'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { cloudinaryUrlOrNull } from '@/lib/media';
import { ButtonLink, UnstyledButton } from '@/components/ui/Button';

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
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export function HeroSection({ banners = [] }: HeroSectionProps) {
  const slides = useMemo<ResolvedSlide[]>(() => {
    const realSlides = banners
      .map((banner): ResolvedSlide => ({
        id: banner.id,
        imageUrl: cloudinaryUrlOrNull(banner.image_url) || undefined,
        mobileImageUrl: cloudinaryUrlOrNull(banner.mobile_image_url) || undefined,
        alt: banner.title?.trim() || banner.subtitle?.trim() || 'Kvastram hero',
        title: banner.title?.trim() || 'Kvastram',
        subtitle:
          banner.subtitle?.trim() ||
          'Handcrafted Indian fashion, curated for festive moments and everyday elegance.',
        buttonText: banner.button_text?.trim() || 'Shop New Arrivals',
        buttonLink: banner.button_link?.trim() || '/products?sort=newest',
      }))
      .filter((banner) => Boolean(banner.imageUrl));

    return realSlides.length > 0
      ? realSlides
      : [
          {
            id: 'kvastram-fallback-hero',
            imageUrl: '/images/home/hero-main.jpg',
            alt: 'Kvastram handcrafted fashion edit',
            title: 'Kvastram',
            subtitle:
              'Handcrafted Indian fashion, curated for festive moments and everyday elegance.',
            buttonText: 'Shop New Arrivals',
            buttonLink: '/products?sort=newest',
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

  const activeSlide = slides[selectedIndex] || slides[0];

  return (
    <section className="hero relative block min-h-[min(70svh,620px)] overflow-hidden bg-[var(--ds-accent-hover)]">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="hero-slider flex h-[min(70svh,620px)] min-h-[420px]">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="hero-slide relative min-h-full min-w-0 flex-[0_0_100%] [scroll-snap-align:start]"
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
              <div className="hero-image-scrim absolute inset-0" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      <div className="hero-content absolute inset-x-0 bottom-0 z-[2]">
        <div className="kv-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="hero-copy"
            >
              <p className="hero-eyebrow">Handmade in Jaipur</p>
              <h1>{activeSlide.title}</h1>
              <p>{activeSlide.subtitle}</p>
              <div className="hero-actions">
                <ButtonLink href={activeSlide.buttonLink} variant="secondary" size="lg">
                  {activeSlide.buttonText}
                </ButtonLink>
                <ButtonLink href="/collections" variant="outline" size="lg">
                  Explore Collections
                </ButtonLink>
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.dl
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hero-proof-list"
            aria-label="Kvastram craft promises"
          >
            <div>
              <dt>Small batch</dt>
              <dd>Limited handmade runs</dd>
            </div>
            <div>
              <dt>Craft led</dt>
              <dd>Block print, kantha, cotton</dd>
            </div>
            <div>
              <dt>Ready to gift</dt>
              <dd>Edited for Indian occasions</dd>
            </div>
          </motion.dl>
        </div>
      </div>

      {/* Slider dots */}
      <div className="hero-dots absolute left-0 right-0 bottom-4 flex justify-center gap-2" aria-hidden="true">
        {slides.map((slide, index) => (
          <UnstyledButton
            key={slide.id}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`hero-dot h-2 w-2 rounded-full transition-all ${
              selectedIndex === index ? 'bg-[var(--ds-surface-page)]' : 'bg-[var(--ds-surface-page)]/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
