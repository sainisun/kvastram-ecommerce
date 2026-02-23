'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/types';

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter only 'hero' section banners if needed, or assume passed banners are filtered.
  const heroBanners = banners
    .filter((b) => b.section === 'hero')
    .sort((a, b) => a.position - b.position);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  if (heroBanners.length === 0) {
    // Fallback to original static content
    return (
      <section className="relative h-[90vh]">
        <div className="absolute inset-0 bg-stone-200">
          <div className="w-full h-full bg-[url('/hero-boutique.jpg')] bg-cover bg-center brightness-[0.85] grayscale-[20%]">
            <div className="w-full h-full bg-gradient-to-br from-stone-400 to-stone-600 opacity-50 mix-blend-multiply"></div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div className="max-w-4xl px-6 space-y-8 text-white">
            <h1 className="text-6xl md:text-8xl font-serif tracking-tight leading-none drop-shadow-lg">
              KVASTRAM
            </h1>
            <p className="text-lg md:text-2xl font-light tracking-wide max-w-2xl mx-auto drop-shadow-md">
              Bridging Heritage & Avant-Garde
            </p>
            <div className="pt-8">
              <Link
                href="/products"
                className="inline-block bg-white text-black px-12 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-black hover:text-white transition-all duration-300"
              >
                Shop The Collection
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const nextSlide = () =>
    setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
  const prevSlide = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + heroBanners.length) % heroBanners.length
    );

  return (
    <section className="relative h-[90vh] overflow-hidden group">
      {heroBanners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <div className="absolute inset-0 bg-stone-200">
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              priority={index === 0}
              className="object-cover brightness-[0.85]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="max-w-4xl px-6 space-y-8 text-white animate-in fade-in zoom-in duration-1000">
              <h1 className="text-6xl md:text-8xl font-serif tracking-tight leading-none drop-shadow-lg">
                {banner.title}
              </h1>
              {/* If we had subtitle in schema, we'd use it. For now, empty or hardcoded logic if needed */}
              {banner.link && (
                <div className="pt-8">
                  <Link
                    href={banner.link}
                    className="inline-block bg-white text-black px-12 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-black hover:text-white transition-all duration-300"
                  >
                    {banner.button_text || 'Shop Now'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {heroBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 transition-colors z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft size={48} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 transition-colors z-20"
            aria-label="Next slide"
          >
            <ChevronRight size={48} />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white'}`}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
