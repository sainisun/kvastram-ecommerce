'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';

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
  const containerRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        handleStartPlayback();
      } else {
        handleStopPlayback();
      }
    }, { threshold: 0.6 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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

  return (
    <Link
      href="/trending-now"
      ref={containerRef}
      className="shrink-0 w-[70vw] sm:w-[280px] flex flex-col gap-3 snap-center group"
    >
      <div className="aspect-[9/16] bg-zinc-100 relative overflow-hidden rounded-2xl shadow-sm">
        <OptimizedImage
          src={reel.thumbnail_url}
          alt={reel.product_name}
          fill
          sizes="(max-width: 640px) 75vw, 280px"
          className={`object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
        />
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url}
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle className="text-white opacity-80 group-hover:scale-110 transition-transform" size={44} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 items-center text-center mt-2 px-2">
        <span className="text-sm font-semibold text-gray-900 line-clamp-1">{reel.product_name}</span>
        <span className="text-sm font-bold text-gray-500">{reel.price}</span>
      </div>
    </Link>
  );
}

export function TrendingReels() {
  const [reels, setReels] = useState<TrendingReelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getTrendingReels()
      .then((res) => { if (!cancelled) setReels(res.reels || []); })
      .catch(() => { if (!cancelled) setReels([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!loading && reels.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50 overflow-hidden w-full relative border-y border-gray-100">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-8 flex flex-col lg:flex-row items-center gap-10">
        
        {/* Left Side: Header & View All */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col items-center lg:items-start text-center lg:text-left z-10 px-4">
          <h3 className="text-sm font-bold tracking-[0.25em] uppercase text-gray-500 mb-2">
            Watch & Buy
          </h3>
          <h2 className="text-4xl text-gray-900 font-[var(--font-display)] tracking-tight mb-4 leading-tight">
            Trending <br className="hidden lg:block"/> Reels
          </h2>
          <p className="text-gray-600 mb-8 max-w-[280px] text-sm leading-relaxed">
            Discover our most loved looks from the community. Swipe through our interactive lookbook.
          </p>
          <Link
            href="/trending-now"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-black hover:scale-105 transition-all shadow-xl shadow-gray-200"
          >
            View All
          </Link>
        </div>

        {/* Right Side: Reels Carousel */}
        <div className="w-full lg:w-[calc(100%-360px)] relative">
          <div className="overflow-x-auto no-scrollbar flex gap-6 snap-x snap-mandatory pb-8 pt-4 px-4 sm:px-0 scroll-smooth">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-[70vw] sm:w-[280px] flex flex-col gap-3 snap-center">
                    <div className="aspect-[9/16] bg-gray-200 animate-pulse rounded-2xl shadow-sm" />
                    <div className="flex flex-col items-center gap-2 mt-1 px-4">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              : reels.map((reel) => <ReelCard key={reel.id} reel={reel} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
