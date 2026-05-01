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
  ArrowLeft,
  ChevronLeft,
  Eye,
  Heart,
  Play,
  Share2,
  Search,
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
  category?: string | null;
  caption?: string | null;
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
  if (tab === 'all') return true;
  return (reel.category || '').toLowerCase() === tab.toLowerCase();
}

function formatCategoryLabel(category: string) {
  return category
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getShowAllHref(basePath: string, tab: string, showAll: boolean) {
  const params = new URLSearchParams();
  if (tab && tab !== 'all') params.set('tab', tab);
  if (!showAll) params.set('show', 'all');
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function ReelsExperienceContent({ basePath = '/reels' }: ReelsExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reels, setReels] = useState<TrendingReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const reelChips = useMemo(() => {
    const categories = Array.from(
      new Set(
        reels
          .map((reel) => reel.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    );

    return [
      { label: 'All Reels', value: 'all' },
      ...categories.map((category) => ({
        label: formatCategoryLabel(category),
        value: category,
      })),
    ];
  }, [reels]);

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
    params.delete('show');
    params.delete('reel');
    if (!nextMode || nextMode === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', nextMode);
    }
    router.replace(`${basePath}?${params.toString()}`, { scroll: false });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-24 md:pb-16 lg:pb-20">
      <div className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-md">
        <div className="kv-container py-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex h-11 items-center gap-3 rounded-full bg-stone-100 px-4 text-stone-900 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-stone-200"
          >
            <Search size={19} className="shrink-0 text-stone-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-stone-500"
            />
          </form>
        </div>
      </div>

      <section className="kv-section-sm">
        <div className="kv-container">
          <div className="kv-tag">Watch &amp; Buy</div>
          <h1 className="kv-title">Reels that sell the story</h1>
        </div>
      </section>

      <div className="kv-container pt-1">
        <div className="filter-chips flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center md:gap-4">
          {reelChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleViewModeChange(chip.value)}
              className={`inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                selectedTab === chip.value
                  ? 'border-stone-950 bg-stone-950 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="mt-4 md:mt-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/5] animate-pulse rounded-[12px] bg-stone-200"
              />
            ))}
          </div>
        ) : (
          <div className="reels-grid">
            {visibleReels.map((reel, idx) => (
              <button
                key={reel.id}
                type="button"
                onClick={() => openReel(idx)}
                className="reel-card group"
              >
                <div className="reel-media">
                  {reel.thumbnail_url ? (
                    <OptimizedImage
                      src={reel.thumbnail_url}
                      alt={reel.product_name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="play">
                    <Play size={34} fill="white" className="text-white" />
                  </div>
                  <div className="relative z-[3]">
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-white/75">
                      {reel.category || 'Watch & Buy'}
                    </div>
                    <div className="reel-title mt-1 line-clamp-2 text-[17px] leading-tight text-white">
                      {reel.product_name}
                    </div>
                  </div>
                </div>
                <div className="reel-info">
                  <div className="reel-title line-clamp-2 text-[16px] leading-snug text-[var(--ink)]">
                    {reel.product_name}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="kv-sub text-sm">{reel.price ? `₹${reel.price}` : 'Tap to view and shop'}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)]">
                      <Eye size={11} />
                      {reel.view_count || 0}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

          {!loading && visibleReels.length === 0 ? (
            <div className="rounded-[12px] border border-[var(--line)] bg-white px-6 py-14 text-center">
              <p className="kv-tag">No Reels</p>
              <h2 className="mt-2 font-heading text-[30px] font-bold text-[var(--ink)]">
                Nothing published here yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-stone-500">
                Reels will appear as soon as they are added from the backend.
              </p>
              <Link href="/products" className="kv-btn mt-5">
                Browse Products
              </Link>
            </div>
          ) : null}

          {visibleReels.length > 0 && filteredReels.length > visibleReels.length ? (
            <div className="mt-10 text-center">
              <Link
                href={getShowAllHref(basePath, selectedTab, showAll)}
                className="kv-btn"
              >
                {showAll ? 'View Fewer Reels' : 'Load More Reels'}
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
    <div className="min-h-screen bg-white pb-24">
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

      <div className="mx-auto max-w-5xl px-3 pt-4 sm:px-4 sm:pt-5">
        <div className="grid grid-cols-3 gap-1 sm:gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[9/16] animate-pulse bg-stone-200 sm:rounded-xl"
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
    document.body.classList.add('reel-player-open');
    window.dispatchEvent(new Event('reel-player-state-change'));

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown') handleSwipeUp();
      if (event.key === 'ArrowUp') handleSwipeDown();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('reel-player-open');
      window.dispatchEvent(new Event('reel-player-state-change'));
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

        <div className="relative z-10 flex items-start justify-between gap-4 p-4 pt-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to reels"
            className="mt-1 rounded-full bg-black/25 p-2 text-white backdrop-blur-md transition hover:bg-black/45"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Reels
            </p>
            <p className="mt-1 truncate text-lg font-semibold text-white">
              {currentReel.product_name}
            </p>
          </div>
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
