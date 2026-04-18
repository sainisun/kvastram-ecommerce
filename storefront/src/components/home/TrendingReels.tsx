'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTrendingReel } from '@/types/homepage';

function ReelCard({ reel }: { reel: HomepageTrendingReel }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLAnchorElement>(null);

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
    setIsPlaying(false);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleStartPlayback();
        } else {
          handleStopPlayback();
        }
      },
      { threshold: 0.6 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      href={`/trending-now?reel=${encodeURIComponent(reel.id)}`}
      ref={containerRef}
      className="group flex w-[78vw] shrink-0 snap-center flex-col gap-4 sm:w-[280px] lg:w-[320px]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-stone-100">
        {reel.thumbnail_url ? (
          <OptimizedImage
            src={reel.thumbnail_url}
            alt={reel.product_name}
            fill
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 280px, 320px"
            className={`object-cover transition-opacity duration-300 ${
              isPlaying ? 'opacity-0' : 'opacity-100'
            }`}
          />
        ) : null}
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url}
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isPlaying ? 'scale-105 opacity-100' : 'scale-100 opacity-0'
          }`}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <PlayCircle
              className="text-white opacity-90 transition-transform group-hover:scale-110"
              size={50}
              strokeWidth={1.4}
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Watch &amp; Buy
              </p>
              <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-white">
                {reel.product_name}
              </h3>
            </div>
            <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              Shop
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-1 px-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-stone-500">
          Trending Now
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="line-clamp-1 text-[18px] font-semibold text-stone-900">
            {reel.price}
          </span>
          <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-stone-700 transition-colors group-hover:text-stone-950">
            View
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

interface TrendingReelsProps {
  reels: HomepageTrendingReel[];
}

export function TrendingReels({ reels }: TrendingReelsProps) {
  if (reels.length === 0) return null;

  const trendingHref = `/trending-now?reel=${encodeURIComponent(reels[0].id)}`;

  return (
    <section className="border-y border-stone-200 bg-[#f8f1eb] py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-14 lg:px-8">
        <div className="w-full shrink-0 space-y-5 text-center lg:w-[300px] lg:pt-6 lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
            Trending Now
          </p>
          <div className="space-y-4">
            <h2 className="font-heading text-[40px] font-semibold leading-[0.95] tracking-[0.01em] text-stone-950 sm:text-[52px]">
              Watch &amp; Buy
            </h2>
            <p className="mx-auto max-w-sm text-[15px] font-[300] leading-7 text-stone-600 lg:mx-0">
              A shoppable edit of Kvastram looks in motion, inspired by retail
              storytelling but powered by your existing reel feed.
            </p>
          </div>
          <Link
            href={trendingHref}
            className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-stone-800"
          >
            Explore Trending
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex gap-5 overflow-x-auto pb-3 pt-2 scroll-smooth no-scrollbar snap-x snap-mandatory">
            {reels.map((reel) => (
              <ReelCard key={reel.id} reel={reel} />
            ))}
          </div>
          <p className="mt-5 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 lg:text-left">
            Real reels, real links, live from your current content setup.
          </p>
        </div>
      </div>
    </section>
  );
}
