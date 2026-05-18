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
import { Modal } from '@/components/ui/Modal';
import { Button, IconButton, UnstyledButton } from '@/components/ui/Button';

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
  return `\u20b9${num.toLocaleString('en-IN')}`;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
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
  const [gridCols, setGridCols] = useState<2 | 3>(() => {
    if (typeof window === 'undefined') return 3;
    try {
      return localStorage.getItem('kvastram_reels_grid') === '2' ? 2 : 3;
    } catch {
      return 3;
    }
  });
  const [showAll, setShowAll] = useState(false);
  const requestedReelId = searchParams.get('reel');

  function setGrid(cols: 2 | 3) {
    setGridCols(cols);
    try { localStorage.setItem('kvastram_reels_grid', String(cols)); } catch {}
  }

  // Load reels only after user action.
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

    const openRequestedReel = window.setTimeout(() => {
      if (requestedIndex >= 12) setShowAll(true);
      setActiveIndex(requestedIndex);
    }, 0);

    return () => window.clearTimeout(openRequestedReel);
  }, [activeIndex, loading, reels, requestedReelId]);

  const visibleReels = useMemo(
    () => (showAll ? reels : reels.slice(0, 12)),
    [reels, showAll]
  );
  const totalViews = useMemo(
    () => reels.reduce((sum, reel) => sum + (reel.view_count || 0), 0),
    [reels]
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
    <div className="reels-page">
      <header className="reels-topbar">
        <div className="reels-shell reels-topbar-inner">
          <Link href="/" className="reels-brand" aria-label="Kvastram home">
            Kvastram
          </Link>
          <div className="reels-grid-toggle" aria-label="Grid layout">
            <IconButton
              type="button"
              onClick={() => setGrid(2)}
              aria-label="2-column grid"
              variant="ghost"
              size="sm"
              className={gridCols === 2 ? 'reels-toggle-button active' : 'reels-toggle-button'}
            >
              <Grid2X2 size={16} />
            </IconButton>
            <IconButton
              type="button"
              onClick={() => setGrid(3)}
              aria-label="3-column grid"
              variant="ghost"
              size="sm"
              className={gridCols === 3 ? 'reels-toggle-button active' : 'reels-toggle-button'}
            >
              <Grid3X3 size={16} />
            </IconButton>
          </div>
        </div>
      </header>

      <section className="reels-shell reels-profile" aria-labelledby="reels-profile-title">
        <div className="reels-avatar" aria-hidden="true">Kv</div>
        <div className="reels-profile-copy">
          <p className="reels-profile-kicker">Watch &amp; Buy</p>
          <h1 id="reels-profile-title">kvastram</h1>
          <p>Handmade Jaipur drops, block prints, quilted layers, and styling ideas in motion.</p>
          <Link href="/products" className="reels-action-link">
            Shop collection
          </Link>
        </div>
        <dl className="reels-stats" aria-label="Reels stats">
          <div>
            <dt>{reels.length || '-'}</dt>
            <dd>reels</dd>
          </div>
          <div>
            <dt>{totalViews ? formatCompactNumber(totalViews) : '-'}</dt>
            <dd>views</dd>
          </div>
          <div>
            <dt>Jaipur</dt>
            <dd>craft</dd>
          </div>
        </dl>
      </section>

      <div className="reels-shell reels-tabs" role="tablist" aria-label="Reels content">
        <UnstyledButton type="button" className="reels-tab active" role="tab" aria-selected="true">
          <Grid3X3 size={16} />
          Reels
        </UnstyledButton>
      </div>

      <div className="reels-shell reels-grid-shell">
        {loading ? (
          <div className={gridCols === 3 ? 'reels-loading-grid reels-loading-grid-3' : 'reels-loading-grid'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="reel-skeleton" />
            ))}
          </div>
        ) : visibleReels.length === 0 ? (
          <div className="reels-empty-state">
            <p className="kv-tag">No Reels</p>
            <h2 className="mt-2 kv-title text-display-md">Nothing here yet</h2>
            <Link href="/products" className="reels-action-link mt-5">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {visibleReels.map((reel, idx) => (
                <UnstyledButton
                  key={reel.id}
                  type="button"
                  onClick={() => openReel(idx)}
                  className="reel-card group"
                  aria-label={`Watch ${reel.product_name}`}
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
                    <div className="reel-grid-gradient" />
                    <div className="reel-grid-overlay">
                      <span className="reel-grid-price">{formatPrice(reel.price)}</span>
                      <span className="reel-grid-views">
                        <Eye size={12} />
                        {formatCompactNumber(reel.view_count || 0)}
                      </span>
                    </div>
                  </div>
                  {gridCols === 2 ? (
                    <div className="reel-info" aria-hidden="true">
                      <span className="reel-title">{reel.product_name}</span>
                    </div>
                  ) : null}
                </UnstyledButton>
              ))}
            </div>

            {reels.length > 12 && !showAll && (
              <div className="mt-10 text-center">
                <Button type="button" variant="outline" onClick={() => setShowAll(true)}>
                  Load More
                </Button>
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
      <div className="sticky top-0 z-40 h-12 border-b border-[var(--line)] bg-[var(--ds-surface-paper)]/95" />
      <div className="kv-container pt-6 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[9/16] animate-pulse rounded-lg bg-[var(--ds-surface-soft)]" />
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
  const currentId = current?.id;

  // Reset like/save state when reel changes
  useEffect(() => {
    if (!currentId) return;
    setSaved(getSavedReels().has(currentId));
    setLiked(false);
    setLikeCount(0);
  }, [currentId]);

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

  // Modal owns scroll lock; this effect keeps reel-specific shell state and keyboard nav.
  useEffect(() => {
    document.body.classList.add('reel-player-open');
    window.dispatchEvent(new Event('reel-player-state-change'));
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('reel-player-open');
      window.dispatchEvent(new Event('reel-player-state-change'));
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
    <Modal
      isOpen
      onClose={onClose}
      showHeader={false}
      rootClassName="z-[1000] p-0"
      className="reel-player-modal h-dvh max-h-none max-w-none border-0 bg-[var(--ds-text-primary)] shadow-none lg:flex lg:items-center lg:justify-center"
      bodyClassName="h-full overflow-hidden p-0"
    >

      {/* Desktop side arrows */}
      <IconButton
        type="button"
        onClick={goPrev}
        disabled={currentIndex === 0}
        variant="ghost"
        size="lg"
        className="absolute left-6 top-1/2 z-50 hidden -translate-y-1/2 rounded-full border-transparent bg-[var(--ds-surface-paper)]/15 text-[var(--ds-text-inverse)] backdrop-blur-md hover:bg-[var(--ds-surface-paper)]/30 disabled:opacity-20 lg:flex"
        aria-label="Previous reel"
      >
        <ChevronLeft size={24} />
      </IconButton>
      <IconButton
        type="button"
        onClick={goNext}
        disabled={currentIndex === localReels.length - 1}
        variant="ghost"
        size="lg"
        className="absolute right-6 top-1/2 z-50 hidden -translate-y-1/2 rounded-full border-transparent bg-[var(--ds-surface-paper)]/15 text-[var(--ds-text-inverse)] backdrop-blur-md hover:bg-[var(--ds-surface-paper)]/30 disabled:opacity-20 lg:flex"
        aria-label="Next reel"
      >
        <ChevronRight size={24} />
      </IconButton>

      {/*
       * Player shell:
       * Mobile: h-full w-full fills the fixed inset-0 parent exactly.
       * Desktop: h-[90dvh] max-w-[390px] with rounded corners.
       */}
      <div
        className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-[var(--ds-text-primary)] lg:h-[90dvh] lg:max-w-[390px] lg:rounded-lg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Video fills the container. */}
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
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[rgba(var(--ds-black-rgb),0.80)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.95)] via-[rgba(var(--ds-black-rgb),0.50)] to-transparent" />

        {/* Progress dots */}
        {localReels.length > 1 && (
          <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-4 pt-2">
            {localReels.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-[var(--ds-surface-paper)]' : 'bg-[var(--ds-surface-paper)]/30'}`}
              />
            ))}
          </div>
        )}

        {/* Top bar */}
        <div className="reel-player-topbar relative z-10 flex items-center gap-3 px-4 pt-10 text-[var(--ds-text-inverse)]">
          <IconButton
            type="button"
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-full border-transparent bg-[var(--ds-text-primary)]/40 text-[var(--ds-text-inverse)] backdrop-blur-sm hover:bg-[var(--ds-text-primary)]/60"
            aria-label="Close reel player"
          >
            <ArrowLeft size={18} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <p className="text-body-xs type-bold  tracking-token-wider text-[var(--ds-text-inverse)]/65">
              {currentIndex + 1} / {localReels.length}
            </p>
            <p className="mt-0.5 line-clamp-1 text-body-sm type-semibold text-[var(--ds-text-inverse)]">
              {current.product_name}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="reel-player-actions absolute bottom-32 right-4 z-20 flex flex-col items-center gap-5 text-[var(--ds-text-inverse)]">
          {/* Like */}
          <Button
            type="button"
            onClick={() => {
              setLiked((prev) => {
                setLikeCount((c) => prev ? c - 1 : c + 1);
                return !prev;
              });
            }}
            variant="ghost"
            size="sm"
            className="flex min-h-0 flex-col items-center gap-0.5 border-transparent px-0 text-[var(--ds-text-inverse)] hover:bg-transparent"
            aria-label={liked ? 'Unlike reel' : 'Like reel'}
          >
            <Heart
              size={28}
              fill={liked ? 'var(--ds-text-inverse)' : 'transparent'}
              color="var(--ds-text-inverse)"
              className="drop-shadow transition-transform active:scale-125"
            />
            <span className="text-body-xs type-semibold text-[var(--ds-text-inverse)] drop-shadow">
              {likeCount > 0 ? likeCount : ''}
            </span>
          </Button>

          {/* Share */}
          <Button
            type="button"
            onClick={handleShare}
            variant="ghost"
            size="sm"
            className="flex min-h-0 flex-col items-center gap-0.5 border-transparent px-0 text-[var(--ds-text-inverse)] hover:bg-transparent"
            aria-label="Share reel"
          >
            <Share2 size={26} className="text-[var(--ds-text-inverse)] drop-shadow" />
            <span className="text-body-xs type-semibold text-[var(--ds-text-inverse)] drop-shadow">Share</span>
          </Button>

          {/* Save */}
          <Button
            type="button"
            onClick={() => setSaved(toggleSavedReel(current.id))}
            variant="ghost"
            size="sm"
            className="flex min-h-0 flex-col items-center gap-0.5 border-transparent px-0 text-[var(--ds-text-inverse)] hover:bg-transparent"
            aria-label={saved ? 'Remove saved reel' : 'Save reel'}
          >
            <Bookmark
              size={26}
              fill={saved ? 'var(--ds-text-inverse)' : 'transparent'}
              className="text-[var(--ds-text-inverse)] drop-shadow transition-transform active:scale-125"
            />
            <span className="text-body-xs type-semibold text-[var(--ds-text-inverse)] drop-shadow">
              {saved ? 'Saved' : 'Save'}
            </span>
          </Button>

          {/* Views */}
          <div
            className="flex flex-col items-center gap-0.5 text-[var(--ds-text-inverse)]"
            aria-label={`${current.view_count || 0} views`}
          >
            <Eye size={24} className="text-[var(--ds-text-inverse)] drop-shadow" />
            <span className="text-body-xs type-semibold text-[var(--ds-text-inverse)] drop-shadow">
              {current.view_count || 0}
            </span>
          </div>
        </div>

        {/* Bottom product overlay */}
        <div className="relative z-10 mt-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* Product card */}
          <Link
            href={current.link_url || '/products'}
            className="reel-product-overlay flex min-w-0 items-center gap-3 rounded-lg border border-[var(--ds-surface-paper)]/70 bg-[var(--ds-surface-paper)]/[0.88] p-2.5 text-[var(--ink)] shadow-[0_18px_50px_rgba(var(--ds-black-rgb),0.24)] backdrop-blur-xl transition active:scale-[0.98]"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-[var(--ds-text-primary)]/10 bg-[var(--ds-surface-paper)]">
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
              <p className="mt-1 text-body-sm type-bold color-accent">
                {formatPrice(current.price)}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--ds-accent-primary)] px-3.5 py-2 text-body-xs type-bold  tracking-token-wider text-[var(--ds-text-inverse)] shadow-lg">
              <ShoppingBag size={14} aria-hidden="true" />
              Shop
            </span>
          </Link>
        </div>

        {/* Swipe hint on first reel */}
        {localReels.length > 1 && currentIndex === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-44 z-10 flex justify-center lg:hidden">
            <span className="rounded-full bg-[var(--ds-text-primary)]/40 px-4 py-1.5 text-body-xs text-[var(--ds-text-inverse)]/70 backdrop-blur-sm">
              Swipe up for next
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
