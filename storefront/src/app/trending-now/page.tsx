'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Play, Heart, Share2, X, ChevronLeft } from 'lucide-react';

interface TrendingReelItem {
  id: string;
  video_url: string;
  thumbnail_url: string;
  product_name: string;
  price: string;
  link_url: string;
}

export default function TrendingNowPage() {
  const [reels, setReels] = useState<TrendingReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getTrendingReels()
      .then((res) => { if (!cancelled) setReels(res.reels || []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} className="text-gray-900" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Trending Reels</h1>
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-3xl mx-auto p-1 sm:p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-1 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[9/16] bg-gray-200 animate-pulse rounded-md sm:rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:gap-4">
            {reels.map((reel, idx) => (
              <button
                key={reel.id}
                onClick={() => setActiveReelIndex(idx)}
                className="relative aspect-[9/16] bg-gray-200 overflow-hidden group rounded-md sm:rounded-xl"
              >
                <OptimizedImage
                  src={reel.thumbnail_url}
                  alt={reel.product_name}
                  fill
                  sizes="50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
                <div className="absolute top-2 right-2 flex items-center gap-1 text-white opacity-80 shadow-sm">
                  <Play size={14} fill="currentColor" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex flex-col items-start gap-0.5">
                  <p className="text-xs font-semibold text-white truncate w-[90%] text-left drop-shadow-md">
                    {reel.product_name}
                  </p>
                  <p className="text-[10px] font-bold text-white/90 drop-shadow-md">
                    {reel.price}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reel Player Modal */}
      {activeReelIndex !== null && reels[activeReelIndex] && (
        <ReelPlayerModal
          reels={reels}
          initialIndex={activeReelIndex}
          onClose={() => setActiveReelIndex(null)}
        />
      )}
    </div>
  );
}

// ─── Modal Player Overlay ──────────────────────────────────────────────────
function ReelPlayerModal({
  reels,
  initialIndex,
  onClose
}: {
  reels: TrendingReelItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const currentReel = reels[currentIndex];

  useEffect(() => {
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Keyboard support
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') handleSwipeUp();
      if (e.key === 'ArrowUp') handleSwipeDown();
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  useEffect(() => {
    // Reset like state when reel changes
    setLiked(false);
    
    // Auto Play new reel
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentReel.product_name,
          text: `Check out ${currentReel.product_name} for ${currentReel.price}!`,
          url: `${window.location.origin}${currentReel.link_url}`,
        });
      } else {
        alert('Sharing is not supported on this browser.');
      }
    } catch {
      // Ignored
    }
  };

  const handleSwipeUp = () => {
    if (currentIndex < reels.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleSwipeDown = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // Simple touch swipe implementation
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };
  const handleTouchEnd = () => {
    if (touchStartY.current - touchEndY.current > 75) {
      handleSwipeUp(); 
    }
    if (touchStartY.current - touchEndY.current < -75) {
      handleSwipeDown(); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center pb-4 sm:pb-0 mx-auto">
      <div 
        className="w-full sm:w-[400px] h-[100dvh] bg-zinc-900 relative flex flex-col justify-between overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Video Background */}
        <video
          key={currentReel.id}
          ref={videoRef}
          src={currentReel.video_url}
          poster={currentReel.thumbnail_url}
          muted
          loop
          playsInline
          autoPlay
          className="absolute inset-0 w-full h-[100dvh] object-cover pointer-events-none"
        />

        {/* Top Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        
        {/* Navigation / Close */}
        <div className="relative z-10 flex items-center justify-between p-4 pt-6">
          <p className="text-white font-semibold text-lg shadow-black drop-shadow-md">Reels</p>
          <button 
            onClick={onClose}
            className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Bottom Elements Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Bottom Context & Floating Actions */}
        <div className="relative z-10 flex items-end justify-between px-4 pb-6 w-full gap-4">
          
          {/* Left / Bottom Area */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Product Banner (The "Buy Now" box) */}
            <div className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center gap-3">
              <div className="h-14 w-12 shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                <OptimizedImage
                  src={currentReel.thumbnail_url}
                  alt={currentReel.product_name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">
                  {currentReel.product_name}
                </p>
                <p className="text-white/80 text-xs font-medium mt-0.5">
                  {currentReel.price}
                </p>
              </div>
              <Link 
                href={currentReel.link_url}
                className="shrink-0 px-4 py-2 bg-white text-black font-bold text-xs rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                Buy Now
              </Link>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex flex-col items-center gap-6 pb-2 shrink-0">
            <button 
               onClick={() => setLiked(!liked)} 
               className="flex flex-col items-center gap-1.5 focus:outline-none group"
            >
              <div className="p-2.5 bg-black/20 backdrop-blur-md rounded-full text-white group-hover:bg-black/40 transition-colors shadow-xl">
                <Heart size={26} fill={liked ? '#ef4444' : 'transparent'} color={liked ? '#ef4444' : 'white'} className={liked ? 'scale-110 transition-transform' : 'transition-transform'} />
              </div>
              <span className="text-white text-xs font-semibold drop-shadow-md">
                 {liked ? '1' : '0'}
              </span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-1.5 focus:outline-none group"
            >
              <div className="p-2.5 bg-black/20 backdrop-blur-md rounded-full text-white group-hover:bg-black/40 transition-colors shadow-xl">
                <Share2 size={26} />
              </div>
              <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
            </button>
          </div>
        </div>
        
      </div>
      
      {/* Desktop Prev/Next Helpers */}
      <div className="hidden sm:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-4 text-white z-50">
        <button 
          onClick={handleSwipeDown}
          disabled={currentIndex === 0}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full disabled:opacity-30 transition-all border border-white/10"
        >
          <ChevronLeft size={24} className="rotate-90" />
        </button>
        <button 
           onClick={handleSwipeUp}
           disabled={currentIndex === reels.length - 1}
           className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full disabled:opacity-30 transition-all border border-white/10"
        >
           <ChevronLeft size={24} className="-rotate-90" />
        </button>
      </div>

    </div>
  );
}
