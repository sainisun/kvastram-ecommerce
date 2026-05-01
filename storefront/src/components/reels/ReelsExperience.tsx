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
  Eye,
  Grid2X2,
  Grid3X3,
  Heart,
  Play,
  Share2,
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
  if (!viewMode || viewMode === 'all') return basePath;
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
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
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
// GRID PAGE
// ─────────────────────────────────────────────────────────
function ReelsExperienceContent({ basePath = '/reels' }: ReelsExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reels, setReels] = useState<TrendingReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [gridCols, setGridCols] = useState<2 | 3>(2);
  const [showAll, setShowAll] = useState(false);

  const selectedTab = searchParams.get('tab') || 'all';

  // Restore grid preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kvastram_reels_grid');
      if (saved === '3') setGridCols(3);
    } catch {}
  }, []);

  function setGrid(cols: 2 | 3) {
    setGridCols(cols);
    try { localStorage.setItem('kvastram_reels_grid', String(cols)); } catch {}
  }

  // Load reels
  useEffect(() => {
    let cancelled = false;
    api.getTrendingReels().then((res) => {
      if (cancelled) return;
      const nextReels: TrendingReelItem[] = res.reels || [];
      setReels(nextReels);

      const selectedId = searchParams.get('reel');
      if (selectedId) {
        const idx = nextReels.findIndex((r) => r.id === selectedId);
        if (idx >= 0) setActiveReelIndex(idx);
      }
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [basePath, searchParams]);

  const filteredReels = useMemo(
    () => reels.filter((r) => matchesReelTab(r, selectedTab)),
    [reels, selectedTab]
  );

  const visibleReels = useMemo(
    () => (showAll ? filteredReels : filteredReels.slice(0, 12)),
    [filteredReels, showAll]
  );

  const reelChips = useMemo(() => {
    const cats = Array.from(
      new Set(reels.map((r) => r.category?.trim()).filter(Boolean) as string[])
    );
    return [
      { label: 'All Reels', value: 'all' },
      ...cats.map((c) => ({ label: formatCategoryLabel(c), value: c })),
    ];
  }, [reels]);

  function openReel(index: number) {
    const reel = visibleReels[index];
    if (!reel) return;
    setActiveReelIndex(index);
    router.replace(getReelHref(basePath, reel.id), { scroll: false });
  }

  function closeReel() {
    setActiveReelIndex(null);
    router.replace(getReelGridHref(basePath, selectedTab), { scroll: false });
  }

  function handleReelChange(index: number, updatedReel?: TrendingReelItem) {
    const next = updatedReel || visibleReels[index];
    if (!next) return;
    setActiveReelIndex(index);
    if (updatedReel) {
      setReels((prev) => prev.map((r) => r.id === next.id ? updatedReel : r));
    }
    router.replace(getReelHref(basePath, next.id), { scroll: false });
  }

  function handleTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('show');
    params.delete('reel');
    if (!tab || tab === 'all') params.delete('tab');
    else params.set('tab', tab);
    router.replace(`${basePath}?${params.toString()}`, { scroll: false });
  }

  const gridClass = gridCols === 3 ? 'reels-grid-3' : 'reels-grid';
  const skeletonClass = gridCols === 3
    ? 'grid grid-cols-3 gap-1.5 md:gap-3'
    : 'grid grid-cols-2 gap-3 md:gap-5';

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-24 md:pb-16">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-md">
        <div className="kv-container flex items-center justify-between gap-3 py-3">
          <span className="text-[13px] font-semibold text-[var(--ink)]">Watch &amp; Buy Reels</span>
          {/* Grid toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-stone-200 p-1">
            <button
              type="button"
              onClick={() => setGrid(2)}
              aria-label="2-column grid"
              className={`rounded-md p-1.5 transition-colors ${gridCols === 2 ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}
            >
              <Grid2X2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setGrid(3)}
              aria-label="3-column grid"
              className={`rounded-md p-1.5 transition-colors ${gridCols === 3 ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Page title */}
      <section className="kv-section-sm">
        <div className="kv-container">
          <div className="kv-tag">Watch &amp; Buy</div>
          <h1 className="kv-title">Reels that sell the story</h1>
        </div>
      </section>

      <div className="kv-container pt-1">
        {/* Category filter chips */}
        {reelChips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 md:flex-wrap md:justify-center md:gap-3">
            {reelChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => handleTabChange(chip.value)}
                className={`inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  selectedTab === chip.value
                    ? 'border-stone-950 bg-stone-950 text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-900 hover:text-stone-900'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="mt-2 md:mt-6">
          {loading ? (
            <div className={skeletonClass}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[9/15] animate-pulse rounded-xl bg-stone-200" />
              ))}
            </div>
          ) : (
            <div className={gridClass}>
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
                        sizes={gridCols === 3
                          ? '(max-width: 640px) 33vw, 25vw'
                          : '(max-width: 640px) 50vw, 25vw'}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="play">
                      <Play size={gridCols === 3 ? 22 : 28} fill="white" className="text-white drop-shadow-lg" />
                    </div>
                    <div className="relative z-[3]">
                      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-white/75 sm:text-[10px]">
                        {reel.category || 'Watch & Buy'}
                      </div>
                      <div className="reel-title mt-0.5 line-clamp-2 leading-tight text-white">
                        {reel.product_name}
                      </div>
                    </div>
                  </div>
                  {gridCols === 2 && (
                    <div className="reel-info">
                      <div className="reel-title line-clamp-1 leading-snug text-[var(--ink)]">
                        {reel.product_name}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="kv-sub text-[11px]">{formatPrice(reel.price)}</span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-[var(--muted)]">
                          <Eye size={9} />
                          {reel.view_count || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!loading && visibleReels.length === 0 && (
            <div className="rounded-xl border border-[var(--line)] bg-white px-6 py-14 text-center">
              <p className="kv-tag">No Reels</p>
              <h2 className="mt-2 font-heading text-[28px] font-bold text-[var(--ink)]">Nothing here yet</h2>
              <Link href="/products" className="kv-btn mt-5">Browse Products</Link>
            </div>
          )}

          {!loading && filteredReels.length > 12 && !showAll && (
            <div className="mt-10 text-center">
              <button type="button" onClick={() => setShowAll(true)} className="kv-btn">
                Load More Reels
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Player modal */}
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

// ─────────────────────────────────────────────────────────
// SUSPENSE FALLBACK
// ─────────────────────────────────────────────────────────
function ReelsExperienceFallback() {
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <div className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 px-4 py-3" />
      <div className="kv-container py-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[9/15] animate-pulse rounded-xl bg-stone-200" />
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

// ─────────────────────────────────────────────────────────
// INSTAGRAM-LIKE REEL PLAYER MODAL
// ─────────────────────────────────────────────────────────
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
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [currentReels, setCurrentReels] = useState(reels);

  const videoRef = useRef<HTMLVideoElement>(null);
  const seenReelsRef = useRef<Set<string>>(new Set());
  const onReelChangeRef = useRef(onReelChange);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const touchStartX = useRef(0);

  const currentReel = currentReels[currentIndex];

  useEffect(() => { setCurrentIndex(initialIndex); }, [initialIndex]);
  useEffect(() => { setCurrentReels(reels); }, [reels]);
  useEffect(() => { onReelChangeRef.current = onReelChange; }, [onReelChange]);

  // Sync saved state per reel
  useEffect(() => {
    if (!currentReel) return;
    setSaved(getSavedReels().has(currentReel.id));
    setLiked(false);
    setLikeCount(0);
  }, [currentReel?.id]);

  const handleSwipeUp = useCallback(() => {
    if (currentIndex >= currentReels.length - 1) return;
    const next = currentIndex + 1;
    setCurrentIndex(next);
    onReelChangeRef.current(next);
  }, [currentIndex, currentReels.length]);

  const handleSwipeDown = useCallback(() => {
    if (currentIndex <= 0) return;
    const next = currentIndex - 1;
    setCurrentIndex(next);
    onReelChangeRef.current(next);
  }, [currentIndex]);

  // Lock body scroll + keyboard nav
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('reel-player-open');
    window.dispatchEvent(new Event('reel-player-state-change'));

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') handleSwipeUp();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') handleSwipeDown();
    }
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('reel-player-open');
      window.dispatchEvent(new Event('reel-player-state-change'));
      window.removeEventListener('keydown', onKey);
    };
  }, [handleSwipeDown, handleSwipeUp, onClose]);

  // Autoplay + view tracking
  useEffect(() => {
    if (!currentReel) return;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (seenReelsRef.current.has(currentReel.id)) return;
    seenReelsRef.current.add(currentReel.id);

    void api.recordTrendingReelView(currentReel.id).then((res) => {
      const updated = res?.reel;
      if (!updated) return;
      setCurrentReels((prev) =>
        prev.map((r) => r.id === currentReel.id ? { ...r, view_count: updated.view_count } : r)
      );
      onReelChangeRef.current(currentIndex, { ...currentReel, view_count: updated.view_count });
    });
  }, [currentIndex, currentReels, currentReel]);

  async function handleShare() {
    try {
      const url = `${window.location.origin}${getReelHref(basePath, currentReel.id)}`;
      if (navigator.share) {
        await navigator.share({ title: currentReel.product_name, text: `${currentReel.product_name} — ${formatPrice(currentReel.price)}`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  }

  function handleLike() {
    setLiked((prev) => {
      setLikeCount((c) => prev ? c - 1 : c + 1);
      return !prev;
    });
  }

  function handleSave() {
    const nowSaved = toggleSavedReel(currentReel.id);
    setSaved(nowSaved);
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartY.current = e.targetTouches[0].clientY;
    touchStartX.current = e.targetTouches[0].clientX;
  }
  function handleTouchMove(e: TouchEvent) {
    touchEndY.current = e.targetTouches[0].clientY;
  }
  function handleTouchEnd() {
    const dy = touchStartY.current - touchEndY.current;
    if (Math.abs(dy) > 60) {
      if (dy > 0) handleSwipeUp();
      else handleSwipeDown();
    }
  }

  if (!currentReel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">

      {/* Desktop prev/next arrows */}
      <button
        type="button"
        onClick={handleSwipeDown}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 z-50 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/25 disabled:opacity-20 lg:flex"
      >
        <ChevronLeft size={26} className="rotate-90" />
      </button>
      <button
        type="button"
        onClick={handleSwipeUp}
        disabled={currentIndex === currentReels.length - 1}
        className="absolute right-4 top-1/2 z-50 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/25 disabled:opacity-20 lg:flex"
      >
        <ChevronLeft size={26} className="-rotate-90" />
      </button>

      {/* Player container — Instagram proportions */}
      <div
        className="relative flex h-[100svh] w-full flex-col overflow-hidden bg-black md:h-[92dvh] md:max-w-[400px] md:rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* VIDEO — cover like Instagram */}
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

        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/70 to-transparent" />
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

        {/* Progress bar dots */}
        {currentReels.length > 1 && (
          <div className="absolute inset-x-0 top-0 z-20 flex gap-[3px] px-4 pt-2">
            {currentReels.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* TOP BAR */}
        <div className="relative z-10 flex items-center gap-3 px-4 pt-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/55">
              Watch &amp; Buy · {currentIndex + 1}/{currentReels.length}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[14px] font-semibold text-white">
              {currentReel.product_name}
            </p>
          </div>
        </div>

        {/* BOTTOM — product + actions side-by-side like Instagram */}
        <div className="relative z-10 mt-auto flex items-end gap-3 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom,2.5rem))] md:pb-6">

          {/* Product card */}
          <Link
            href={currentReel.link_url}
            className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-black/50 p-3 backdrop-blur-xl transition active:scale-[0.98]"
          >
            {/* Product thumbnail */}
            <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-white/10">
              <OptimizedImage
                src={currentReel.thumbnail_url}
                alt={currentReel.product_name}
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            {/* Product info */}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-white">
                {currentReel.product_name}
              </p>
              <p className="mt-1 text-[13px] font-bold text-white/90">
                {formatPrice(currentReel.price)}
              </p>
            </div>
            {/* Shop Now */}
            <span className="shrink-0 rounded-full bg-[var(--sienna)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-lg">
              Shop Now
            </span>
          </Link>

          {/* Action buttons — right side like Instagram */}
          <div className="flex shrink-0 flex-col items-center gap-5 pb-1">

            {/* Like */}
            <button type="button" onClick={handleLike} className="flex flex-col items-center gap-1">
              <Heart
                size={26}
                fill={liked ? '#ef4444' : 'transparent'}
                color={liked ? '#ef4444' : 'white'}
                className="drop-shadow transition-transform active:scale-125"
              />
              <span className="text-[10px] font-semibold text-white drop-shadow">
                {likeCount > 0 ? likeCount : ''}
              </span>
            </button>

            {/* Share */}
            <button type="button" onClick={handleShare} className="flex flex-col items-center gap-1">
              <Share2 size={24} className="text-white drop-shadow" />
              <span className="text-[10px] font-semibold text-white drop-shadow">Share</span>
            </button>

            {/* Save/Bookmark */}
            <button type="button" onClick={handleSave} className="flex flex-col items-center gap-1">
              <Bookmark
                size={24}
                fill={saved ? 'white' : 'transparent'}
                className="text-white drop-shadow transition-transform active:scale-125"
              />
              <span className="text-[10px] font-semibold text-white drop-shadow">
                {saved ? 'Saved' : 'Save'}
              </span>
            </button>

            {/* Views */}
            <div className="flex flex-col items-center gap-1">
              <Eye size={22} className="text-white/80 drop-shadow" />
              <span className="text-[10px] font-semibold text-white/80 drop-shadow">
                {currentReel.view_count || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Swipe hint — first reel only */}
        {currentReels.length > 1 && currentIndex === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-40 z-10 flex justify-center md:hidden">
            <span className="rounded-full bg-black/35 px-3 py-1 text-[10px] text-white/70 backdrop-blur-sm">
              Swipe up for next ↑
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
