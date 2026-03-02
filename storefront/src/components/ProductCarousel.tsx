'use client';

import { useState, useRef } from 'react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import type { Product, MoneyAmount } from '@/types';
import WishlistButton from '@/components/ui/WishlistButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className="product-grid-prem">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="prod-card-prem animate-pulse">
            <div
              className="prod-img-wrap-prem"
              style={{ background: 'var(--off-white)' }}
            />
            <div className="prod-info-prem">
              <div
                style={{
                  height: '8px',
                  background: 'var(--off-white)',
                  width: '40%',
                  marginBottom: '8px',
                }}
              />
              <div
                style={{
                  height: '14px',
                  background: 'var(--off-white)',
                  width: '70%',
                  marginBottom: '6px',
                }}
              />
              <div
                style={{
                  height: '12px',
                  background: 'var(--off-white)',
                  width: '30%',
                }}
              />
            </div>
          </div>
        ))}
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
    <div className="product-grid-prem">
      {products.map((product) => (
        <div key={product.id} className="prod-card-prem">
          {/* Image + Quick Add + wishlist */}
          <Link
            href={`/products/${product.handle || product.id}`}
            style={{ display: 'block' }}
          >
            <div className="prod-img-wrap-prem">
              {product.thumbnail ? (
                <OptimizedImage
                  src={product.thumbnail}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--off-white)',
                  }}
                />
              )}
              <span className="prod-tag-prem">New</span>
              <button
                className="prod-quick-add-prem"
                tabIndex={-1}
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart(e as unknown as React.MouseEvent, product);
                }}
              >
                {addedId === product.id ? '✓ Added' : 'Add to Bag'}
              </button>
            </div>
          </Link>
          {/* Wishlist absolute */}
          <div className="prod-wishlist-prem">
            <WishlistButton
              productId={product.id}
              title={product.title}
              price={product.variants?.[0]?.prices?.[0]?.amount || 0}
              currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
              thumbnail={product.thumbnail || undefined}
              handle={product.handle || product.id}
              variantId={product.variants?.[0]?.id}
              size="sm"
            />
          </div>
          {/* Info */}
          <Link
            href={`/products/${product.handle || product.id}`}
            className="prod-info-prem"
            style={{ display: 'block' }}
          >
            <p className="prod-collection-prem">
              {product.subtitle || product.collection?.title || 'Kvastram'}
            </p>
            <h3 className="prod-name-prem">{product.title}</h3>
            <p className="prod-price-prem">{getPrice(product)}</p>
          </Link>
        </div>
      ))}
    </div>
  );
}
