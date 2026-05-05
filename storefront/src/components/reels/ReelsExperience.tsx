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
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid2X2,
  Grid3X3,
  Heart,
  Share2,
  ShoppingBag,
} from 'lucide-react';
import { api } from '@/lib/api';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface TrendingReelItem {
  id: string;
  video_url: string;
  thumbnail_url: string;
  product_name: string;
  price: string;
  price_amount?: number | null;
  link_url: string;
  view_count?: number;
  category?: string | null;
}

interface ReelsExperienceProps {
  basePath?: string;
}

function formatPrice(price: string) {
  if (!price) return '';
  const num = parseFloat(price.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return price;
  return '₹' + num.toLocaleString('en-IN');
}

function getSavedReels(): Set<string> {
  try {
    const raw = localStorage.getItem('kvastram_saved_reels');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function toggleSavedReel(id: string): boolean {
  const saved = getSavedReels();
  if (saved.has(id)) {
    saved.delete(id);
  } else {
    saved.add(id);
  }
  try {
    localStorage.setItem('kvastram_saved_reels', JSON.stringify([...saved]));
  } catch {}
  return saved.has(id);
}

// ─────────────────────────────────────────────────────────
// GRID
// ─────────────────────────────────────────────────────────
function ReelsExperienceContent({ basePath = '/reels' }: ReelsExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reels, setReels] = useState<TrendingReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [gridCols, setGridCols] = useState<2 | 3>(2);
  const [showAll, setShowAll] = useState(false);
  const requestedReelId = searchParams.get('reel');

  // Restore grid preference from localStorage
  useEffect(() => {
    try {
      if (localStorage.getItem('kvastram_reels_grid') === '3') setGridCols(3);
    } catch {}
  }, []);

  function setGrid(cols: 2 | 3) {
    setGridCols(cols);
    try { localStorage.setItem('kvastram_reels_grid', String(cols)); } catch {}
  }

  // Load reels — never auto-open, user must tap
  useEffect(() => {
    let cancelled = false;
    api.getTrendingReels().then((res) => {
      if (!cancelled) setReels(res.reels || []);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading || !requestedReelId || activeIndex !== null) return;

    const requestedIndex = reels.findIndex((reel) => reel.id === requestedReelId);
    if (requestedIndex < 0) return;

    if (requestedIndex >= 12) setShowAll(true);
    setActiveIndex(requestedIndex);
  }, [activeIndex, loading, reels, requestedReelId]);

  const visibleReels = useMemo(
    () => (showAll ? reels : reels.slice(0, 12)),
    [reels, showAll]
  );

  function openReel(index: number) {
    setActiveIndex(index);
    // Keep the active reel shareable without a full navigation.
    const reelId = visibleReels[index]?.id;
    router.replace(reelId ? `${basePath}?reel=${reelId}` : basePath, { scroll: false });
  }

  function closeReel() {
    setActiveIndex(null);
    router.replace(basePath, { scroll: false });
  }

  function handleReelChange(index: number, updatedReel?: TrendingReelItem) {
    setActiveIndex(index);
    const reelId = visibleReels[index]?.id;
    if (reelId) router.replace(`${basePath}?reel=${reelId}`, { scroll: false });
    if (updatedReel) {
      setReels((prev) => prev.map((r) => r.id === updatedReel.id ? updatedReel : r));
    }
  }

  const gridClass = gridCols === 3 ? 'reels-grid-3' : 'reels-grid';

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur-md">
        <div className="kv-container flex items-center justify-between gap-3 py-3">
          <span className="text-body-sm type-semibold color-ink">Watch &amp; Buy Reels</span>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--line)] p-1">
            <button
              type="button"
              onClick={() => setGrid(2)}
              aria-label="2-column grid"
              className={`rounded-md p-1.5 transition-colors ${gridCols === 2 ? 'bg-[var(--ink)] text-white' : 'color-muted hover:color-ink'}`}
            >
              <Grid2X2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setGrid(3)}
              aria-label="3-column grid"
              className={`rounded-md p-1.5 transition-colors ${gridCols === 3 ? 'bg-[var(--ink)] text-white' : 'color-muted hover:color-ink'}`}
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="kv-container pt-6 pb-4">
        <div className="kv-tag">Watch &amp; Buy</div>
        <h1 className="kv-title">Reels that sell the story</h1>
      </div>

      {/* Grid */}
      <div className="kv-container">
        {loading ? (
          <div className={gridCols === 3 ? 'grid grid-cols-3 gap-1.5' : 'grid grid-cols-2 gap-3'}>
            {[1, 2, 3, 4, 6].map((i) => (
              <div key={i} className="aspect-[9/16] animate-pulse rounded-lg bg-stone-200" />
            ))}
          </div>
        ) : visibleReels.length === 0 ? (
          <div className="rounded-lg border border-[var(--line)] bg-white px-6 py-14 text-center">
            <p className="kv-tag">No Reels</p>
            <h2 className="mt-2 kv-title text-display-md">Nothing here yet</h2>
            <Link href="/products" className="kv-btn mt-5 inline-flex">Browse Products</Link>
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {visibleReels.map((reel, idx) => (
                <button
                  key={reel.id}
                  type="button"
                  onClick={() => openReel(idx)}
                  className="reel-card group"
                >
                  <div className="reel-media">
                    {reel.video_url ? (
                      <video
                        className="reel-video transition-transform duration-500 group-hover:scale-105"
                        src={reel.video_url}
                        poster={reel.thumbnail_url || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-label={reel.product_name}
                      />
                    ) : reel.thumbnail_url ? (
                      <OptimizedImage
                        src={reel.thumbnail_url}
                        alt={reel.product_name}
                        fill
                        sizes={gridCols === 3 ? '33vw' : '50vw'}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[var(--soft)]" />
                    )}
                    {/* Gradient keeps autoplaying thumbnails legible against the card edge. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  </div>
                  {gridCols === 2 && (
                    <div className="reel-info">
                      <div className="reel-title line-clamp-1 color-ink">
                        {reel.product_name}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-body-xs type-semibold color-sienna">{formatPrice(reel.price)}</span>
                        <span className="inline-flex items-center gap-0.5 text-body-xs color-muted">
                          <Eye size={10} />
                          {reel.view_count || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {reels.length > 12 && !showAll && (
              <div className="mt-10 text-center">
                <button type="button" onClick={() => setShowAll(true)} className="kv-btn">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Player */}
      {activeIndex !== null && visibleReels[activeIndex] ? (
        <ReelPlayerModal
          reels={visibleReels}
          initialIndex={activeIndex}
          onClose={closeReel}
          onReelChange={handleReelChange}
        />
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SUSPENSE WRAPPER
// ─────────────────────────────────────────────────────────
function ReelsGridSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <div className="sticky top-0 z-40 h-12 border-b border-[var(--line)] bg-white/95" />
      <div className="kv-container pt-6 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[9/16] animate-pulse rounded-lg bg-stone-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReelsExperience(props: ReelsExperienceProps) {
  return (
    <Suspense fallback={<ReelsGridSkeleton />}>
      <ReelsExperienceContent {...props} />
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────────
// INSTAGRAM-STYLE PLAYER MODAL
// ─────────────────────────────────────────────────────────
function ReelPlayerModal({
  reels,
  initialIndex,
  onClose,
  onReelChange,
}: {
  reels: TrendingReelItem[];
  initialIndex: number;
  onClose: () => void;
  onReelChange: (index: number, updated?: TrendingReelItem) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [localReels, setLocalReels] = useState(reels);

  const videoRef = useRef<HTMLVideoElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const onReelChangeRef = useRef(onReelChange);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => { onReelChangeRef.current = onReelChange; }, [onReelChange]);
  useEffect(() => { setLocalReels(reels); }, [reels]);

  const current = localReels[currentIndex];

  // Reset like/save state when reel changes
  useEffect(() => {
    if (!current) return;
    setSaved(getSavedReels().has(current.id));
    setLiked(false);
    setLikeCount(0);
  }, [current?.id]);

  const goNext = useCallback(() => {
    if (currentIndex >= localReels.length - 1) return;
    const next = currentIndex + 1;
    setCurrentIndex(next);
    onReelChangeRef.current(next);
  }, [currentIndex, localReels.length]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const next = currentIndex - 1;
    setCurrentIndex(next);
    onReelChangeRef.current(next);
  }, [currentIndex]);

  // Autoplay + view count
  useEffect(() => {
    if (!current) return;
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
    if (seenRef.current.has(current.id)) return;
    seenRef.current.add(current.id);
    void api.recordTrendingReelView(current.id).then((res) => {
      const updated = res?.reel;
      if (!updated) return;
      setLocalReels((prev) =>
        prev.map((r) => r.id === current.id ? { ...r, view_count: updated.view_count } : r)
      );
      onReelChangeRef.current(currentIndex, { ...current, view_count: updated.view_count });
    });
  }, [currentIndex, current]);

  // Lock body scroll + keyboard nav
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [goNext, goPrev, onClose]);

  // Touch swipe (vertical)
  function onTouchStart(e: TouchEvent) {
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndY.current = e.targetTouches[0].clientY;
  }
  function onTouchMove(e: TouchEvent) {
    touchEndY.current = e.targetTouches[0].clientY;
  }
  function onTouchEnd() {
    const dy = touchStartY.current - touchEndY.current;
    if (Math.abs(dy) > 50) {
      if (dy > 0) goNext();
      else goPrev();
    }
  }

  async function handleShare() {
    try {
      const url = window.location.origin + '/reels';
      if (navigator.share) {
        await navigator.share({ title: current.product_name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  }

  if (!current) return null;

  return (
    /*
     * Outer: fixed inset-0 bg-black — covers entire screen on all devices.
     * On desktop: flex centering so the 400px player sits in the middle.
     * On mobile: no flex — the inner player fills inset-0 directly.
     */
    <div className="fixed inset-0 z-[100] bg-black lg:flex lg:items-center lg:justify-center">

      {/* Desktop side arrows — only visible lg+ */}
      <button
        type="button"
        onClick={goPrev}
        disabled={currentIndex === 0}
        className="absolute left-6 top-1/2 z-50 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/30 disabled:opacity-20 lg:flex"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        onClick={goNext}
        disabled={currentIndex === localReels.length - 1}
        className="absolute right-6 top-1/2 z-50 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-md transition hover:bg-white/30 disabled:opacity-20 lg:flex"
      >
        <ChevronRight size={24} />
      </button>

      {/*
       * Player shell:
       * Mobile  → h-full w-full (fills the fixed inset-0 parent exactly, no cut)
       * Desktop → h-[90dvh] max-w-[390px] with rounded corners
       */}
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-black lg:h-[90dvh] lg:max-w-[390px] lg:rounded-lg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* VIDEO — fills container, no cut */}
        <video
          key={current.id}
          ref={videoRef}
          src={current.video_url}
          poster={current.thumbnail_url}
          muted
          loop
          playsInline
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Gradients */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

        {/* Progress dots */}
        {localReels.length > 1 && (
          <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-4 pt-2">
            {localReels.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        )}

        {/* Top bar */}
        <div className="relative z-10 flex items-center gap-3 px-4 pt-10">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-body-xs type-bold uppercase tracking-token-wider text-white/50">
              {currentIndex + 1} / {localReels.length}
            </p>
            <p className="mt-0.5 line-clamp-1 text-body-sm type-semibold text-white">
              {current.product_name}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-32 right-4 z-20 flex flex-col items-center gap-5">
          {/* Like */}
          <button
            type="button"
            onClick={() => {
              setLiked((prev) => {
                setLikeCount((c) => prev ? c - 1 : c + 1);
                return !prev;
              });
            }}
            className="flex flex-col items-center gap-0.5 text-white"
            aria-label={liked ? 'Unlike reel' : 'Like reel'}
          >
            <Heart
              size={28}
              fill={liked ? 'white' : 'transparent'}
              color="white"
              className="drop-shadow transition-transform active:scale-125"
            />
            <span className="text-body-xs type-semibold text-white drop-shadow">
              {likeCount > 0 ? likeCount : ''}
            </span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-0.5 text-white"
            aria-label="Share reel"
          >
            <Share2 size={26} className="text-white drop-shadow" />
            <span className="text-body-xs type-semibold text-white drop-shadow">Share</span>
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={() => setSaved(toggleSavedReel(current.id))}
            className="flex flex-col items-center gap-0.5 text-white"
            aria-label={saved ? 'Remove saved reel' : 'Save reel'}
          >
            <Bookmark
              size={26}
              fill={saved ? 'white' : 'transparent'}
              className="text-white drop-shadow transition-transform active:scale-125"
            />
            <span className="text-body-xs type-semibold text-white drop-shadow">
              {saved ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Views */}
          <div
            className="flex flex-col items-center gap-0.5 text-white"
            aria-label={`${current.view_count || 0} views`}
          >
            <Eye size={24} className="text-white drop-shadow" />
            <span className="text-body-xs type-semibold text-white drop-shadow">
              {current.view_count || 0}
            </span>
          </div>
        </div>

        {/* Bottom product overlay */}
        <div
          className="relative z-10 mt-auto px-3"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {/* Product card */}
          <Link
            href={current.link_url || '/products'}
            className="flex min-w-0 items-center gap-3 rounded-lg border border-white/70 bg-white/[0.88] p-2.5 text-[var(--ink)] shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl transition active:scale-[0.98]"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-black/10 bg-white">
              <OptimizedImage
                src={current.thumbnail_url}
                alt={current.product_name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-body-sm type-semibold leading-token-snug color-ink">
                {current.product_name}
              </p>
              <p className="mt-1 text-body-sm type-bold color-sienna">
                {formatPrice(current.price)}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--sienna)] px-3.5 py-2 text-body-xs type-bold uppercase tracking-token-wider text-white shadow-lg">
              <ShoppingBag size={14} aria-hidden="true" />
              Shop
            </span>
          </Link>
        </div>

        {/* Swipe hint on first reel */}
        {localReels.length > 1 && currentIndex === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-44 z-10 flex justify-center lg:hidden">
            <span className="rounded-full bg-black/40 px-4 py-1.5 text-body-xs text-white/70 backdrop-blur-sm">
              Swipe up for next ↑
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

