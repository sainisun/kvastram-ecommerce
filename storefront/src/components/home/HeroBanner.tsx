'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';

interface HeroBannerItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  sort_order: number;
}

export function HeroBanner() {
  const [banners, setBanners] = useState<HeroBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadHeroBanners() {
      try {
        const response = await api.getHeroBanners();

        if (!cancelled) {
          setBanners(response.banners || []);
        }
      } catch (error) {
        console.error('Failed to load hero banners:', error);
        if (!cancelled) {
          setBanners([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHeroBanners();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [banners.length]);

  useEffect(() => {
    if (activeIndex <= banners.length - 1) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, banners.length]);

  if (loading) {
    return (
      <div className="relative w-full overflow-hidden bg-gray-200 animate-pulse" style={{ height: 'calc(100svh - 72px)', minHeight: '400px' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[activeIndex];

  function goToSlide(index: number) {
    setActiveIndex(index);
  }

  function goToPrevious() {
    setActiveIndex((current) =>
      current === 0 ? banners.length - 1 : current - 1
    );
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % banners.length);
  }

  return (
    <section className="hero-section homepage-slider relative w-full overflow-hidden bg-stone-100">
      <div className="hero-banner relative w-full" style={{ height: 'calc(100svh - 72px)', minHeight: '400px' }}>
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <OptimizedImage
              src={banner.image_url}
              alt={
                banner.title
                  ? `${banner.title} - Kvastram`
                  : `Kvastram hero banner ${index + 1}`
              }
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-top"
            />

            {(banner.title || banner.subtitle || (banner.button_text && banner.button_link)) ? (
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent">
                <div className="absolute inset-x-0 bottom-[20%] mx-auto flex w-full max-w-7xl justify-center px-6 text-center md:bottom-0 md:justify-start md:px-8 md:pb-10 md:pt-24 md:text-left">
                  <div className="max-w-xl text-white">
                    {banner.title ? (
                      <h2 className="font-heading text-[30px] font-semibold uppercase leading-[1.08] tracking-[0.02em] sm:text-[34px] md:text-[52px]">
                        {banner.title}
                      </h2>
                    ) : null}
                    {banner.subtitle ? (
                      <p className="font-body mt-3 max-w-lg text-[15px] font-[300] leading-[1.7] text-white/85 sm:text-base md:text-lg">
                        {banner.subtitle}
                      </p>
                    ) : null}
                    {banner.button_text && banner.button_link ? (
                      <Link
                        href={banner.button_link}
                        className="font-body mt-5 inline-flex items-center rounded-full bg-white px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-900 transition hover:bg-gray-100 md:px-6 md:py-3"
                      >
                        {banner.button_text}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {banners.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 md:flex"
              aria-label="Previous hero banner"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 md:flex"
              aria-label="Next hero banner"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 md:bottom-6">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex
                      ? 'w-8 bg-white'
                      : 'w-2.5 bg-white/55 hover:bg-white/80'
                  }`}
                  aria-label={`Go to hero banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {currentBanner.button_link && currentBanner.button_text ? (
        <div className="sr-only">{currentBanner.button_text}</div>
      ) : null}
    </section>
  );
}
