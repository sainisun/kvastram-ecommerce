'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Check } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

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

  // Renders into document.body via portal — escapes any ancestor stacking
  // context (e.g. Header's backdrop-blur-md) so fixed positioning works correctly.
  return createPortal(
    <div
      className="modal-overlay open"
      onClick={onClose}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-head">
          <h3 className="serif line-clamp-1 text-[18px]">{product.title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="icon-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body — prototype: .modal-body */}
        <div className="modal-body">
          {/* Two-col on md+, single col on mobile — prototype: .quickview-layout */}
          <div className="quickview-layout">

            {/* Image — aspect-ratio box so height is always defined */}
            <div className="quickview-img" style={{ padding: 0 }}>
              {images.length > 0 ? (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
                  <OptimizedImage
                    src={images[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <span>{product.title.charAt(0)}</span>
              )}
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Stars */}
              {reviewAvg !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#f6ad55', fontSize: 15 }}>
                    {'★'.repeat(Math.round(reviewAvg))}{'☆'.repeat(5 - Math.round(reviewAvg))}
                  </span>
                  <span className="section-sub" style={{ fontSize: 12 }}>
                    {reviewAvg.toFixed(1)} / 5 · {reviewCount} reviews
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="pd-price">
                {price ? formatPrice(price) : '—'}
              </div>

              {/* Description */}
              {product.description ? (
                <p className="section-sub" style={{ fontSize: 14, lineHeight: 1.75, WebkitLineClamp: 4, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description}
                </p>
              ) : null}

              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div>
                  <strong style={{ fontSize: 13 }}>Variant</strong>
                  <div className="option-row">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`option-btn${selectedVariant?.id === v.id ? ' active' : ''}`}
                      >
                        {v.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>
              )}

              {/* CTAs — prototype style */}
              <div style={{ display: 'grid', gap: 10, marginTop: 'auto' }}>
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`kv-btn w-full justify-center ${added ? 'border-green-600 bg-green-600 text-white' : 'kv-btn-primary'}`}
                  style={{ opacity: adding ? 0.6 : 1 }}
                >
                  {adding ? (
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
                  ) : added ? (
                    <><Check size={15} />Added to Cart</>
                  ) : (
                    <><ShoppingBag size={15} />Add to Cart</>
                  )}
                </button>
                <Link
                  href={`/products/${product.handle || product.id}`}
                  onClick={onClose}
                  className="kv-btn kv-btn-outline w-full justify-center"
                >
                  Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
