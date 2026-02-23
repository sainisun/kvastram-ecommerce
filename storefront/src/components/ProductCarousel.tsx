'use client';

import { useState, useRef } from 'react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, MoneyAmount } from '@/types';
import WishlistButton from '@/components/ui/WishlistButton';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import type { Product as ProductType } from '@/types';

interface ProductCarouselProps {
  products?: Product[];
  loading?: boolean;
  showNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export default function ProductCarousel({
  products = [],
  loading: externalLoading,
  showNavigation = true,
  autoPlay = false,
  autoPlayInterval = 5000,
}: ProductCarouselProps) {
  const { currentRegion } = useShop();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null
  );
  const carouselRef = useRef<HTMLDivElement>(null);
  const loading = externalLoading || products.length === 0;

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (!product.variants || product.variants.length === 0) {
      showNotification('error', 'Product unavailable');
      return;
    }
    const variant = product.variants[0];

    const prices = variant.prices || [];
    const priceObj =
      prices.find(
        (p: MoneyAmount) =>
          p.currency_code ===
          (currentRegion?.currency_code || 'usd').toLowerCase()
      ) || prices[0];

    if (!priceObj) {
      showNotification('error', 'Price unavailable for this region');
      return;
    }

    addItem({
      id: variant.id,
      variantId: variant.id,
      quantity: 1,
      title: product.title,
      price: priceObj.amount,
      currency: priceObj.currency_code,
      thumbnail: product.thumbnail || undefined,
      material: product.material || undefined,
      origin: product.origin_country || undefined,
      sku: variant.sku || undefined,
      description: product.description || undefined,
    });

    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  const getPrice = (product: Product) => {
    const prices = product.variants?.[0]?.prices || [];
    const currencyCode = currentRegion?.currency_code || 'usd';
    const price =
      prices.find(
        (p: MoneyAmount) => p.currency_code === currencyCode.toLowerCase()
      ) || prices[0];

    if (price) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: price?.currency_code?.toUpperCase() || 'USD',
      }).format(price.amount / 100);
    }

    return 'Contact for price';
  };

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.children[0]?.clientWidth || 280;
      const gap = 32; // gap-8 = 32px
      carouselRef.current.scrollTo({
        left: index * (cardWidth + gap),
        behavior: 'smooth',
      });
    }
  };

  const handlePrev = () => {
    const newIndex =
      currentIndex > 0 ? currentIndex - 1 : Math.max(0, products.length - 4);
    setCurrentIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, products.length - 4);
    const newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    scrollToIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="flex gap-8 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-64 animate-pulse">
              <div className="aspect-[3/4] bg-stone-100 mb-4 rounded-sm"></div>
              <div className="h-4 bg-stone-100 w-2/3 mb-2 mx-auto"></div>
              <div className="h-4 bg-stone-100 w-1/3 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-stone-500 font-light italic">
        No products found.
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Navigation Buttons */}
      {showNavigation && products.length > 4 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous products"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next products"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="group flex flex-col flex-shrink-0 w-64 md:w-72"
          >
            <Link
              href={`/products/${product.handle || product.id}`}
              className="block relative aspect-[3/4] bg-stone-100 overflow-hidden mb-6 rounded-sm shadow-sm hover:shadow-xl transition-shadow duration-500"
            >
              {product.thumbnail ? (
                <Image
                  src={product.thumbnail}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 256px, 288px"
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100 font-serif italic">
                  No Image
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-x-0 bottom-0 top-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Quick Actions Bar - Slide Up */}
              <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 flex gap-2 justify-center pb-6">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setQuickViewProduct(product);
                  }}
                  className="py-3 px-4 bg-white/90 backdrop-blur-sm text-stone-900 hover:bg-stone-900 hover:text-white transition-all shadow-lg"
                  aria-label="Quick view"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all shadow-lg ${
                    addedId === product.id
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-stone-900 hover:bg-stone-900 hover:text-white border border-white hover:border-stone-900'
                  }`}
                >
                  {addedId === product.id ? 'Added' : 'Add to Cart'}
                </button>
              </div>

              {/* Top Right Icons */}
              <div className="absolute top-4 right-4 flex flex-col gap-3 translate-x-12 group-hover:translate-x-0 transition-transform duration-300 z-20">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white shadow-sm hover:shadow-md transition-all text-stone-600 hover:text-red-500">
                  <WishlistButton
                    productId={product.id}
                    title={product.title}
                    price={product.variants?.[0]?.prices?.[0]?.amount || 0}
                    currency={
                      currentRegion?.currency_code?.toUpperCase() || 'USD'
                    }
                    thumbnail={product.thumbnail || undefined}
                    handle={product.handle || product.id}
                    variantId={product.variants?.[0]?.id}
                    size="sm"
                  />
                </div>
              </div>
            </Link>

            {/* Product Info */}
            <Link
              href={`/products/${product.handle || product.id}`}
              className="space-y-2 text-center mt-auto"
            >
              <p className="text-[10px] text-stone-500 font-bold tracking-[0.2em] uppercase">
                {product.subtitle ||
                  product.collection?.title ||
                  'Kvastram Collection'}
              </p>
              <h3 className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition-colors line-clamp-2">
                {product.title}
              </h3>
              <p className="text-sm font-medium text-stone-900">
                {getPrice(product)}
              </p>
            </Link>
          </div>
        ))}
      </div>

      {/* Dots Indicator for Mobile */}
      {products.length > 1 && (
        <div className="flex justify-center gap-2 mt-6 md:hidden">
          {products.slice(0, Math.min(products.length, 6)).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                scrollToIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-stone-900 w-4' : 'bg-stone-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
