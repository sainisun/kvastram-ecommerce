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
    <Link
      href={reel.link_url}
      className="min-w-[140px] flex flex-col gap-3"
      onMouseEnter={() => void handleStartPlayback()}
      onMouseLeave={handleStopPlayback}
    >
      <div className="aspect-[9/16] bg-zinc-200 relative overflow-hidden">
        <OptimizedImage
          src={reel.thumbnail_url}
          alt={reel.product_name}
          fill
          sizes="140px"
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
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle className="text-white opacity-80" size={30} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-zinc-500 uppercase truncate">{reel.product_name}</span>
        <span className="text-[12px] font-bold text-black">{reel.price}</span>
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
    <section className="py-16 bg-white">
      <h3 className="px-6 mb-8 text-[11px] font-bold tracking-[0.2em] uppercase text-black">
        TRENDING NOW
      </h3>
      <div className="overflow-x-auto no-scrollbar flex gap-4 px-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[140px] flex flex-col gap-3">
                <div className="aspect-[9/16] bg-zinc-200 animate-pulse" />
                <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse" />
              </div>
            ))
          : reels.map((reel) => <ReelCard key={reel.id} reel={reel} />)}
      </div>
    </section>
  );
}
