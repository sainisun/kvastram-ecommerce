'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { StarRating } from '@/components/ui/StarRating';
import { api } from '@/lib/api';

interface QuickViewProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  thumbnail?: string | null;
  images?: Array<{ url: string }> | string[];
  rating?: number;
  review_count?: number;
  variants?: Array<{
    id: string;
    title: string;
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
    inventory_quantity?: number;
  }>;
}

interface QuickViewModalProps {
  product: QuickViewProduct;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
}: QuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<{
    rating: number;
    review_count: number;
  }>({ rating: 0, review_count: 0 });
  const { addItem } = useCart();
  const addedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when product changes
  useEffect(() => {
    setSelectedVariant(product.variants?.[0] ?? undefined);
    setCurrentImageIndex(0);
    setQuantity(1);
    setAdding(false);
    setAdded(false);
    setError(null);
    setReviews({ rating: 0, review_count: 0 });
  }, [product]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) {
        clearTimeout(addedTimeoutRef.current);
      }
    };
  }, []);

  // Fetch reviews summary
  useEffect(() => {
    if (isOpen && product.id) {
      let cancelled = false;
      api
        .getReviews(product.id)
        .then((data) => {
          if (cancelled) return;
          const reviewList = data.reviews || [];
          if (reviewList.length > 0) {
            const avgRating =
              reviewList.reduce(
                (acc: number, r: { rating: number }) => acc + r.rating,
                0
              ) / reviewList.length;
            setReviews({ rating: avgRating, review_count: reviewList.length });
          }
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('Failed to fetch reviews:', err);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [isOpen, product.id]);

  const images = product.images?.length
    ? product.images.map((img: any) =>
        typeof img === 'string' ? img : img.url
      )
    : ([product.thumbnail].filter(Boolean) as string[]);
  const displayPrice = selectedVariant?.prices?.[0]?.amount || 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (images.length || 1));
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + (images.length || 1)) % (images.length || 1)
    );
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prevImage, nextImage]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddToCart = async () => {
    setAdding(true);
    setError(null);
    try {
      const currency = selectedVariant?.prices?.[0]?.currency_code || 'USD';
      await addItem({
        id: selectedVariant?.id || product.id,
        variantId: selectedVariant?.id || product.id,
        quantity,
        title: product.title,
        price: displayPrice,
        currency: currency.toUpperCase(),
        thumbnail: product.thumbnail || undefined,
      });
      setAdded(true);
      // Clear previous timeout if exists
      if (addedTimeoutRef.current) {
        clearTimeout(addedTimeoutRef.current);
      }
      addedTimeoutRef.current = setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError('Failed to add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-10 lg:inset-16 bg-white z-50 overflow-hidden rounded-lg shadow-2xl"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <h2 className="text-lg font-serif text-stone-900 truncate">
                  {product.title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 min-h-[44px] min-w-[44px] hover:bg-stone-100 rounded-full transition-colors flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto">
                <div className="grid md:grid-cols-2 h-full">
                  {/* Image Gallery */}
                  <div className="relative bg-stone-50 p-6 flex items-center justify-center">
                    {images.length > 0 ? (
                      <>
                        <div className="relative w-full max-w-md aspect-square">
                          <OptimizedImage
                            src={
                              images[currentImageIndex] ||
                              '/images/placeholder.jpg'
                            }
                            alt={product.title}
                            fill
                            className="object-cover rounded-lg"
                            priority
                          />
                        </div>

                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-4 p-2 min-h-[44px] min-w-[44px] bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors flex items-center justify-center"
                              aria-label="Previous image"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-4 p-2 min-h-[44px] min-w-[44px] bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors flex items-center justify-center"
                              aria-label="Next image"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </>
                        )}

                        {/* Image Counter */}
                        {images.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} / {images.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full max-w-md aspect-square bg-stone-200 rounded-lg flex items-center justify-center">
                        <span className="text-stone-400">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-6 md:p-8 flex flex-col">
                    {/* Rating */}
                    {reviews.review_count > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <StarRating rating={reviews.rating} size={16} />
                        <span className="text-sm text-stone-500">
                          {reviews.rating.toFixed(1)} ({reviews.review_count}{' '}
                          reviews)
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-2xl font-serif text-stone-900">
                        ${(displayPrice / 100).toFixed(2)}
                      </span>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-stone-600 text-sm leading-relaxed mb-6 line-clamp-4">
                        {product.description}
                      </p>
                    )}

                    {/* Variants */}
                    {product.variants && product.variants.length > 1 && (
                      <div className="mb-6">
                        <label className="text-xs uppercase font-bold text-stone-500 mb-2 block">
                          Select Variant
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {product.variants.map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => setSelectedVariant(variant)}
                              className={`px-4 py-2 border text-sm transition-colors ${
                                selectedVariant?.id === variant.id
                                  ? 'border-stone-900 bg-stone-900 text-white'
                                  : 'border-stone-300 hover:border-stone-500'
                              }`}
                            >
                              {variant.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-6">
                      <label className="text-xs uppercase font-bold text-stone-500 mb-2 block">
                        Quantity
                      </label>
                      <div className="flex items-center border border-stone-300 w-fit">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-4 py-2 hover:bg-stone-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-4 py-2 min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="px-4 py-2 hover:bg-stone-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 mt-auto">
                      <button
                        onClick={handleAddToCart}
                        disabled={adding}
                        className={`w-full py-4 font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 ${
                          added
                            ? 'bg-green-600 text-white'
                            : 'bg-stone-900 text-white hover:bg-stone-800'
                        } disabled:opacity-50`}
                      >
                        {adding ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          >
                            <ShoppingBag size={18} />
                          </motion.div>
                        ) : added ? (
                          <>
                            <Star size={18} />
                            Added to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={18} />
                            Add to Cart
                          </>
                        )}
                      </button>

                      <Link
                        href={`/products/${product.handle}`}
                        onClick={onClose}
                        className="w-full py-4 border border-stone-300 text-stone-700 font-bold uppercase tracking-widest text-xs hover:border-stone-900 hover:text-stone-900 transition-colors text-center block"
                      >
                        View Full Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
