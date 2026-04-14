'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface TrendingReelItem {
  id: string;
  video_url: string;
  thumbnail_url: string;
  product_name: string;
  price: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}

function ReelCard({ reel }: { reel: TrendingReelItem }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function handleStartPlayback() {
    if (!videoRef.current) return;

    try {
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  function handleStopPlayback() {
    if (!videoRef.current) return;

    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setIsPlaying(false);
  }

  return (
    <article
      className="group relative h-[280px] w-[160px] shrink-0 overflow-hidden rounded-[12px] bg-stone-200 md:h-[350px] md:w-[200px]"
      onMouseEnter={() => void handleStartPlayback()}
      onMouseLeave={handleStopPlayback}
      onFocus={() => void handleStartPlayback()}
      onBlur={handleStopPlayback}
    >
      <OptimizedImage
        src={reel.thumbnail_url}
        alt={reel.product_name}
        fill
        sizes="(max-width: 768px) 160px, 200px"
        className={`object-cover transition-opacity duration-300 ${
          isPlaying ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url}
        muted
        loop
        playsInline
        preload="metadata"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-3 text-white">
        <p className="font-body line-clamp-2 text-[14px] font-medium leading-[1.45] tracking-[0.03em] md:text-[14px]">
          {reel.product_name}
        </p>
        <p className="font-body mt-1 text-[14px] font-normal text-white/90">
          {reel.price}
        </p>
        <Link
          href={reel.link_url}
          className="font-body mt-3 inline-flex rounded-full bg-white px-4 py-2 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-900 transition hover:bg-stone-100"
        >
          Shop Now
        </Link>
      </div>
    </article>
  );
}

export function TrendingReels() {
  const [reels, setReels] = useState<TrendingReelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTrendingReels() {
      try {
        const response = await api.getTrendingReels();

        if (!cancelled) {
          setReels(response.reels || []);
        }
      } catch (error) {
        console.error('Failed to load trending reels:', error);
        if (!cancelled) {
          setReels([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTrendingReels();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && reels.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 md:px-8 md:py-10">
      <div className="mb-6 text-center">
        <h2 className="font-heading text-[28px] font-semibold uppercase tracking-[0.02em] text-gray-900 md:text-[36px]">
          Trending Now
        </h2>
      </div>

      <div className="overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none]">
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex gap-4 md:gap-5">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[280px] w-[160px] shrink-0 animate-pulse rounded-[12px] bg-gray-200 md:h-[350px] md:w-[200px]"
                />
              ))
            : reels.map((reel) => <ReelCard key={reel.id} reel={reel} />)}
        </div>
      </div>
    </section>
  );
}
