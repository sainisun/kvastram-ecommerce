'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [reviewSummary, setReviewSummary] = useState<{ rating: number; count: number } | null>(null);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const addedTimer = useRef<NodeJS.Timeout | null>(null);

  // Reset when product changes
  useEffect(() => {
    setSelectedVariant(product.variants?.[0]);
    setImgIndex(0);
    setAdded(false);
    setError(null);
    setReviewSummary(null);
  }, [product.id]);

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  // Fetch reviews
  useEffect(() => {
    if (!isOpen || !product.id) return;
    let cancelled = false;
    api.getReviews(product.id).then((data) => {
      if (cancelled) return;
      const list = data.reviews || [];
      if (list.length > 0) {
        const avg = list.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / list.length;
        setReviewSummary({ rating: avg, count: list.length });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, product.id]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
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

  const images: string[] = (
    product.images?.length
      ? product.images.map((img) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
      : []
  ) as string[];
  if (!images.length && product.thumbnail) images.push(product.thumbnail);

  const variantPrices = selectedVariant?.prices || [];
  const priceObj =
    variantPrices.find((p) => p.currency_code?.toLowerCase() === 'inr') || variantPrices[0];
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
      addedTimer.current = setTimeout(() => setAdded(false), 2000);
    } catch {
      setError('Could not add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal — bottom sheet on mobile, centered card on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl md:inset-4 md:bottom-auto md:top-1/2 md:max-h-[85dvh] md:-translate-y-1/2 md:rounded-2xl lg:inset-x-auto lg:left-1/2 lg:w-full lg:max-w-[900px] lg:-translate-x-1/2"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-white px-5 py-4">
              <h2 className="line-clamp-1 font-heading text-[17px] font-semibold text-[var(--ink)]">
                {product.title}
              </h2>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body — stacked on mobile, side-by-side on desktop */}
            <div className="md:grid md:grid-cols-[1fr,1fr]">

              {/* Image column */}
              <div className="relative bg-[var(--soft)]">
                {images.length > 0 ? (
                  <>
                    <div className="relative aspect-square w-full">
                      <OptimizedImage
                        src={images[imgIndex] || ''}
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
                          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow transition hover:bg-white disabled:opacity-30"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          onClick={() => setImgIndex((p) => Math.min(images.length - 1, p + 1))}
                          disabled={imgIndex === images.length - 1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow transition hover:bg-white disabled:opacity-30"
                        >
                          <ChevronRight size={18} />
                        </button>
                        {/* Dot indicators */}
                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setImgIndex(i)}
                              className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-4 bg-[var(--ink)]' : 'w-1.5 bg-[var(--ink)]/30'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center text-[var(--muted)]">
                    No image
                  </div>
                )}
              </div>

              {/* Details column */}
              <div className="flex flex-col gap-5 p-6 md:overflow-y-auto md:p-8">

                {/* Rating */}
                {reviewSummary && (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--sienna)]">
                      {'★'.repeat(Math.round(reviewSummary.rating))}{'☆'.repeat(5 - Math.round(reviewSummary.rating))}
                    </span>
                    <span className="text-[12px] text-[var(--muted)]">
                      {reviewSummary.rating.toFixed(1)} ({reviewSummary.count})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div>
                  <p className="font-heading text-[28px] font-semibold text-[var(--ink)]">
                    {price ? formatPrice(price) : '—'}
                  </p>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="line-clamp-4 text-[14px] leading-[1.75] text-[var(--muted)]">
                    {product.description}
                  </p>
                )}

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
                          className={`rounded-md border px-3 py-1.5 text-[13px] transition-colors ${
                            selectedVariant?.id === v.id
                              ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                              : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
                          }`}
                        >
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="text-[13px] text-[var(--danger)]">{error}</p>
                )}

                {/* CTAs */}
                <div className="mt-auto flex flex-col gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className={`kv-btn w-full justify-center gap-2 ${added ? 'bg-green-600 border-green-600 text-white hover:bg-green-700' : 'kv-btn-primary'} disabled:opacity-50`}
                  >
                    {adding ? (
                      <span className="animate-spin">↻</span>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
