'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Eye,
  Heart,
  Play,
  Share2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface TrendingReelItem {
  id: string;
  video_url: string;
  thumbnail_url: string;
  product_name: string;
  price: string;
  link_url: string;
  view_count?: number;
  created_at?: string;
}

interface ReelsExperienceProps {
  basePath?: string;
}

function getReelHref(basePath: string, reelId?: string) {
  return reelId ? `${basePath}?reel=${encodeURIComponent(reelId)}` : basePath;
}

function getReelGridHref(basePath: string, viewMode?: string) {
  if (!viewMode || viewMode === 'all') {
    return basePath;
  }

  return `${basePath}?tab=${encodeURIComponent(viewMode)}`;
}

function matchesReelTab(reel: TrendingReelItem, tab: string) {
  const text = `${reel.product_name} ${reel.link_url}`.toLowerCase();

  switch (tab) {
    case 'bridal':
      return /bridal|wedding|lehenga/.test(text);
    case 'festive':
      return /festive|party|occasion|celebration/.test(text);
    case 'everyday':
      return /everyday|cotton|kurta|daily|office/.test(text);
    case 'tutorials':
      return /tutorial|how to|how-to|guide|demo/.test(text);
    case 'styling tips':
      return /style|styling|look|tips/.test(text);
    default:
      return true;
  }
}

function ReelsExperienceContent({ basePath = '/reels' }: ReelsExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reels, setReels] = useState<TrendingReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const selectedTab = searchParams.get('tab') || 'all';
  const showAll = searchParams.get('show') === 'all';

  useEffect(() => {
    let cancelled = false;

    api
      .getTrendingReels()
      .then((res) => {
        if (cancelled) return;

        const nextReels = res.reels || [];
        setReels(nextReels);

        const selectedId = searchParams.get('reel');
        if (selectedId) {
          const selectedIndex = nextReels.findIndex(
            (reel: TrendingReelItem) => reel.id === selectedId
          );
          setActiveReelIndex(
            selectedIndex >= 0 ? selectedIndex : nextReels.length > 0 ? 0 : null
          );
          return;
        }

        setActiveReelIndex(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [basePath, searchParams]);

  const filteredReels = useMemo(() => {
    const nextReels = reels.filter((reel) =>
      matchesReelTab(reel, selectedTab)
    );
    return nextReels;
  }, [reels, selectedTab]);

  const visibleReels = useMemo(
    () => (showAll ? filteredReels : filteredReels.slice(0, 12)),
    [filteredReels, showAll]
  );

  function openReel(index: number) {
    const selectedReel = visibleReels[index];
    if (!selectedReel) return;

    setActiveReelIndex(index);
    router.replace(getReelHref(basePath, selectedReel.id), {
      scroll: false,
    });
  }

  function closeReel() {
    setActiveReelIndex(null);
    router.replace(getReelGridHref(basePath, selectedTab), { scroll: false });
  }

  function handleReelChange(index: number, updatedReel?: TrendingReelItem) {
    const nextReel = updatedReel || visibleReels[index];
    if (!nextReel) return;

    setActiveReelIndex(index);

    if (updatedReel) {
      setReels((current) =>
        current.map((reel) =>
          reel.id === nextReel.id ? updatedReel : reel
        )
      );
    }

    router.replace(getReelHref(basePath, nextReel.id), {
      scroll: false,
    });
  }

  function handleViewModeChange(nextMode: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!nextMode || nextMode === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', nextMode);
    }
    router.replace(`${basePath}?${params.toString()}`, { scroll: false });
  }

  const reelChips = [
    { label: 'All', value: 'all' },
    { label: 'Bridal', value: 'bridal' },
    { label: 'Festive', value: 'festive' },
    { label: 'Everyday', value: 'everyday' },
    { label: 'Tutorials', value: 'tutorials' },
    { label: 'Styling Tips', value: 'styling tips' },
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-[1280px] px-4 pt-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400"
        >
          <Link href="/" className="transition-colors hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-700">Reels</span>
        </nav>

        <section className="border-b border-stone-100 pb-10 text-center">
          <h1 className="font-heading text-[clamp(48px,6vw,76px)] font-normal leading-none tracking-[-0.03em] text-stone-950">
            Watch &amp; <em className="italic">Buy</em>
          </h1>
          <p className="mx-auto mt-4 max-w-[520px] font-heading text-[18px] font-normal italic leading-8 text-stone-700">
            See our pieces in motion. Tap any reel to shop.
          </p>
        </section>

        <div className="filter-chips mt-8 flex flex-wrap justify-center gap-3">
          {reelChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleViewModeChange(chip.value)}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                selectedTab === chip.value
                  ? 'border-stone-950 bg-stone-950 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[9/16] animate-pulse rounded-[2px] bg-stone-200"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
            {visibleReels.map((reel, idx) => (
              <button
                key={reel.id}
                type="button"
                onClick={() => openReel(idx)}
                className="group relative aspect-[9/16] overflow-hidden rounded-[2px] bg-stone-200 text-left"
              >
                <OptimizedImage
                  src={reel.thumbnail_url}
                  alt={reel.product_name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                  <Play size={12} fill="currentColor" />
                  Play
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <p className="line-clamp-2 text-sm font-semibold text-white sm:text-base">
                    {reel.product_name}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-white/90">
                    <span className="text-xs font-semibold sm:text-sm">
                      {reel.price}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em]">
                      <Eye size={12} />
                      {reel.view_count || 0}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

          {reels.length > visibleReels.length ? (
            <div className="mt-10 text-center">
              <Link
                href={showAll ? '/reels' : '/reels?show=all'}
                className="inline-flex items-center gap-2 rounded-none border border-stone-200 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-900 transition-colors hover:border-stone-900"
              >
                Load More Reels
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {activeReelIndex !== null && visibleReels[activeReelIndex] ? (
        <ReelPlayerModal
          basePath={basePath}
          reels={visibleReels}
          initialIndex={activeReelIndex}
          onClose={closeReel}
          onReelChange={handleReelChange}
        />
      ) : null}
    </div>
  );
}

function ReelsExperienceFallback() {
  return (
    <div className="min-h-screen bg-[#f6f1ea] pb-20">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/85 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-stone-200 p-2 text-stone-800 transition hover:border-stone-950 hover:text-stone-950"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                Watch &amp; Buy
              </p>
              <h1 className="mt-1 text-lg font-semibold text-stone-950">
                Shoppable Reels
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-2 pt-3 sm:px-4 sm:pt-5">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[9/16] animate-pulse rounded-xl bg-stone-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReelsExperience(props: ReelsExperienceProps) {
  return (
    <Suspense fallback={<ReelsExperienceFallback />}>
      <ReelsExperienceContent {...props} />
    </Suspense>
  );
}

function ReelPlayerModal({
  basePath,
  reels,
  initialIndex,
  onClose,
  onReelChange,
}: {
  basePath: string;
  reels: TrendingReelItem[];
  initialIndex: number;
  onClose: () => void;
  onReelChange: (index: number, updatedReel?: TrendingReelItem) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [currentReels, setCurrentReels] = useState(reels);
  const videoRef = useRef<HTMLVideoElement>(null);
  const seenReelsRef = useRef<Set<string>>(new Set());
  const onReelChangeRef = useRef(onReelChange);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const currentReel = currentReels[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    setCurrentReels(reels);
  }, [reels]);

  useEffect(() => {
    onReelChangeRef.current = onReelChange;
  }, [onReelChange]);

  const handleSwipeUp = useCallback(() => {
    if (currentIndex >= currentReels.length - 1) return;
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    onReelChangeRef.current(nextIndex);
  }, [currentIndex, currentReels.length]);

  const handleSwipeDown = useCallback(() => {
    if (currentIndex <= 0) return;
    const nextIndex = currentIndex - 1;
    setCurrentIndex(nextIndex);
    onReelChangeRef.current(nextIndex);
  }, [currentIndex]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown') handleSwipeUp();
      if (event.key === 'ArrowUp') handleSwipeDown();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSwipeDown, handleSwipeUp, onClose]);

  useEffect(() => {
    setLiked(false);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    const activeReel = currentReels[currentIndex];
    if (!activeReel || seenReelsRef.current.has(activeReel.id)) {
      return;
    }

    seenReelsRef.current.add(activeReel.id);

    void api.recordTrendingReelView(activeReel.id).then((response) => {
      const updatedReel = response?.reel;
      if (!updatedReel) {
        return;
      }

      setCurrentReels((previous) =>
        previous.map((reel) =>
          reel.id === activeReel.id
            ? { ...reel, view_count: updatedReel.view_count }
            : reel
        )
      );
      onReelChangeRef.current(currentIndex, {
        ...activeReel,
        view_count: updatedReel.view_count,
      });
    });
  }, [currentIndex, currentReels]);

  async function handleShare() {
    try {
      const shareUrl = `${window.location.origin}${getReelHref(basePath, currentReel.id)}`;
      if (navigator.share) {
        await navigator.share({
          title: currentReel.product_name,
          text: `Check out ${currentReel.product_name} for ${currentReel.price}!`,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // No-op if the share sheet or clipboard is unavailable.
    }
  }

  function handleTouchStart(event: TouchEvent) {
    touchStartY.current = event.targetTouches[0].clientY;
  }

  function handleTouchMove(event: TouchEvent) {
    touchEndY.current = event.targetTouches[0].clientY;
  }

  function handleTouchEnd() {
    if (touchStartY.current - touchEndY.current > 75) {
      handleSwipeUp();
    }

    if (touchStartY.current - touchEndY.current < -75) {
      handleSwipeDown();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black">
      <div
        className="relative flex h-[100dvh] w-full max-w-[430px] flex-col justify-between overflow-hidden bg-zinc-950"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <video
          key={currentReel.id}
          ref={videoRef}
          src={currentReel.video_url}
          poster={currentReel.thumbnail_url}
          muted
          loop
          playsInline
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="relative z-10 flex items-center justify-between p-4 pt-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Reels
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {currentReel.product_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/25 p-2 text-white backdrop-blur-md transition hover:bg-black/45"
          >
            <X size={22} />
          </button>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-4 px-4 pb-6">
          <div className="flex-1 space-y-4">
            <Link
              href={currentReel.link_url}
              className="flex items-center gap-3 rounded-[22px] border border-white/20 bg-white/10 p-3 backdrop-blur-xl"
            >
              <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10">
                <OptimizedImage
                  src={currentReel.thumbnail_url}
                  alt={currentReel.product_name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {currentReel.product_name}
                </p>
                <p className="mt-1 text-xs font-medium text-white/80">
                  {currentReel.price}
                </p>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-black">
                Buy Now
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-5 pb-2">
            <div className="flex flex-col items-center gap-1.5">
              <div className="rounded-full bg-black/25 p-2.5 text-white backdrop-blur-md">
                <Eye size={24} />
              </div>
              <span className="text-xs font-semibold text-white">
                {currentReel.view_count || 0}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="rounded-full bg-black/25 p-2.5 text-white backdrop-blur-md">
                <Heart
                  size={24}
                  fill={liked ? '#ef4444' : 'transparent'}
                  color={liked ? '#ef4444' : 'white'}
                  className={
                    liked ? 'scale-110 transition-transform' : 'transition-transform'
                  }
                />
              </div>
              <span className="text-xs font-semibold text-white">
                {liked ? 'Liked' : 'Like'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="rounded-full bg-black/25 p-2.5 text-white backdrop-blur-md">
                <Share2 size={24} />
              </div>
              <span className="text-xs font-semibold text-white">Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="fixed right-8 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 text-white sm:flex">
        <button
          type="button"
          onClick={handleSwipeDown}
          disabled={currentIndex === 0}
          className="rounded-full border border-white/10 bg-white/10 p-3 backdrop-blur-md transition hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronLeft size={24} className="rotate-90" />
        </button>
        <button
          type="button"
          onClick={handleSwipeUp}
          disabled={currentIndex === currentReels.length - 1}
          className="rounded-full border border-white/10 bg-white/10 p-3 backdrop-blur-md transition hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronLeft size={24} className="-rotate-90" />
        </button>
      </div>
    </div>
  );
}
