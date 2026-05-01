'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { api } from '@/lib/api';

interface QuickViewProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  thumbnail?: string | null;
  images?: Array<{ url: string | null }> | string[];
  variants?: Array<{
    id: string;
    title: string;
    prices?: Array<{ amount: number; currency_code: string }>;
    inventory_quantity?: number;
  }>;
}

interface QuickViewModalProps {
  product: QuickViewProduct;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [imgIndex, setImgIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewAvg, setReviewAvg] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const addedTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSelectedVariant(product.variants?.[0]);
    setImgIndex(0);
    setAdded(false);
    setError(null);
    setReviewAvg(null);
    setReviewCount(0);
  }, [product.id]);

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  useEffect(() => {
    if (!isOpen || !product.id) return;
    let cancelled = false;
    api.getReviews(product.id).then((data) => {
      if (cancelled) return;
      const list: Array<{ rating: number }> = data.reviews || [];
      if (list.length > 0) {
        setReviewAvg(list.reduce((s, r) => s + r.rating, 0) / list.length);
        setReviewCount(list.length);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, product.id]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard nav
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setImgIndex((p) => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setImgIndex((p) => Math.min(images.length - 1, p + 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Build images array
  const images: string[] = [];
  if (product.images?.length) {
    for (const img of product.images) {
      const url = typeof img === 'string' ? img : img.url;
      if (url) images.push(url);
    }
  }
  if (!images.length && product.thumbnail) images.push(product.thumbnail);

  const priceObj =
    (selectedVariant?.prices || []).find((p) => p.currency_code?.toLowerCase() === 'inr') ||
    selectedVariant?.prices?.[0];
  const price = priceObj?.amount || 0;

  async function handleAddToCart() {
    setAdding(true);
    setError(null);
    try {
      await addItem({
        id: selectedVariant?.id || product.id,
        variantId: selectedVariant?.id || product.id,
        quantity: 1,
        title: product.title,
        price,
        currency: 'INR',
        thumbnail: product.thumbnail || undefined,
      });
      setAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 2200);
    } catch {
      setError('Could not add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  if (!isOpen) return null;

  // createPortal renders directly into document.body, escaping any ancestor
  // stacking context (e.g. Header's backdrop-blur-md creates one that would
  // trap position:fixed children rendered inside the React tree).
  return createPortal(
    (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-[760px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-2xl"
        style={{ maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <h3 className="line-clamp-1 font-heading text-[18px] font-semibold text-[var(--ink)]">
            {product.title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--sienna)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto">
          {/* Two-column layout: image | details (stacked on mobile, side-by-side on md+) */}
          <div className="grid gap-0 md:grid-cols-2">

            {/* Image */}
            <div className="relative min-h-[260px] bg-[var(--soft)] md:min-h-[360px]">
              {images.length > 0 ? (
                <>
                  <div className="relative h-full min-h-[260px] w-full md:min-h-[360px]">
                    <OptimizedImage
                      src={images[imgIndex]}
                      alt={product.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIndex((p) => Math.max(0, p - 1))}
                        disabled={imgIndex === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow transition hover:bg-white disabled:opacity-30"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setImgIndex((p) => Math.min(images.length - 1, p + 1))}
                        disabled={imgIndex === images.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow transition hover:bg-white disabled:opacity-30"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIndex(i)}
                            className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-4 bg-[var(--ink)]' : 'w-1.5 bg-[var(--ink)]/25'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex min-h-[260px] w-full items-center justify-center font-heading text-[64px] text-[var(--muted)] md:min-h-[360px]">
                  {product.title.charAt(0)}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-5 p-6 md:p-8">

              {/* Stars */}
              {reviewAvg !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-[var(--sienna)]">
                    {'★'.repeat(Math.round(reviewAvg))}{'☆'.repeat(5 - Math.round(reviewAvg))}
                  </span>
                  <span className="text-[12px] text-[var(--muted)]">
                    {reviewAvg.toFixed(1)} ({reviewCount} reviews)
                  </span>
                </div>
              )}

              {/* Price — sienna, bold, large — matches prototype .pd-price */}
              <div
                className="font-heading font-black text-[var(--sienna)]"
                style={{ fontSize: 28 }}
              >
                {price ? formatPrice(price) : '—'}
              </div>

              {/* Description */}
              {product.description ? (
                <p className="line-clamp-4 text-[14px] leading-[1.75] text-[var(--muted)]">
                  {product.description}
                </p>
              ) : null}

              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Variant
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                          selectedVariant?.id === v.id
                            ? 'border-[var(--sienna)] bg-[var(--sienna)]/8 text-[var(--sienna)]'
                            : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--sienna)] hover:text-[var(--sienna)]'
                        }`}
                      >
                        {v.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-[13px] text-red-600">{error}</p>
              )}

              {/* CTAs */}
              <div className="mt-auto flex flex-col gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`kv-btn w-full justify-center gap-2 ${added ? 'border-green-600 bg-green-600 text-white' : 'kv-btn-primary'} disabled:opacity-50`}
                >
                  {adding ? (
                    <span className="inline-block animate-spin">↻</span>
                  ) : added ? (
                    <><Check size={16} /> Added to Cart</>
                  ) : (
                    <><ShoppingBag size={16} /> Add to Cart</>
                  )}
                </button>
                <Link
                  href={`/products/${product.handle || product.id}`}
                  onClick={onClose}
                  className="kv-btn kv-btn-outline w-full justify-center"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    ), document.body
  );
}
