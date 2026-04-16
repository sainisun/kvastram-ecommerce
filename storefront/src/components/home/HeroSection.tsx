'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

const STATIC_HERO: HeroBannerItem = {
  id: 'static',
  image_url: '',
  title: 'Crafted for the Woman Who Moves',
  subtitle: 'New Arrivals SS26',
  button_text: 'SHOP NOW',
  button_link: '/products',
  is_active: true,
  sort_order: 0,
};

export function HeroSection() {
  const [banners, setBanners] = useState<HeroBannerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getHeroBanners()
      .then((res) => {
        if (!cancelled) {
          const active = (res.banners || []).filter((b: HeroBannerItem) => b.is_active);
          setBanners(active);
        }
      })
      .catch(() => { if (!cancelled) setBanners([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % banners.length);
    }, 4500);
    return () => window.clearInterval(t);
  }, [banners.length]);

  const current = banners[activeIndex] ?? STATIC_HERO;

  if (loading) {
    return <div className="w-full bg-zinc-200 animate-pulse" style={{ height: '751px' }} />;
  }

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '751px' }}>
      {current.image_url ? (
        <OptimizedImage
          src={current.image_url}
          alt={current.title ?? 'Kvastram'}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-700" />
      )}

      {/* Gradient overlay — bottom heavy like prototype */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Editorial copy — bottom-left */}
      <div className="absolute bottom-12 left-8 right-8">
        {current.subtitle && (
          <span className="block mb-4 text-[10px] font-bold tracking-[0.3em] uppercase text-white">
            {current.subtitle}
          </span>
        )}
        {current.title && (
          <h2 className="font-heading text-4xl text-white leading-tight mb-8">
            {current.title}
          </h2>
        )}
        {current.button_text && current.button_link && (
          <Link
            href={current.button_link}
            className="inline-block px-8 py-3 border border-white text-white text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-colors duration-300"
          >
            {current.button_text}
          </Link>
        )}
      </div>

      {/* Slide dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
