"use client";

import React, { useState, useRef } from 'react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import type { Product, MoneyAmount } from '@/types';
import WishlistButton from '@/components/ui/WishlistButton';
import { useCurrency } from '@/context/currency-context';

interface ProductCarouselProps {
  products?: Product[];
  loading?: boolean;
  showNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

function ProductCarousel({
  products = [],
  loading: externalLoading,
}: ProductCarouselProps) {
  const { currentRegion } = useShop();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const [addedId, setAddedId] = useState<string | null>(null);
  const loading = externalLoading || products.length === 0;

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (!product.variants || product.variants.length === 0) {
      showNotification('error', 'Product unavailable');
      return;
    }
    const variant = product.variants[0];
    const prices = variant.prices || [];
    const inrPrice =
      prices.find((p: MoneyAmount) => p.currency_code?.toLowerCase() === 'inr') ||
      prices[0];

    if (!inrPrice) {
      showNotification('error', 'Price unavailable for this region');
      return;
    }

    addItem({
      id: variant.id,
      variantId: variant.id,
      quantity: 1,
      title: product.title,
      price: inrPrice.amount,
      currency: 'INR',
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
    const inrPrice =
      prices.find((p: MoneyAmount) => p.currency_code?.toLowerCase() === 'inr') ||
      prices[0];
    if (inrPrice) {
      return formatPrice(inrPrice.amount);
    }
    return 'Contact for price';
  };

  if (loading) {
    return (
      <div className="products-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="product-card animate-pulse">
            <div className="product-media" style={{ background: 'var(--soft)' }} />
            <div className="product-info">
              <div style={{ height: 8, background: 'var(--line)', width: '40%', marginBottom: 8, borderRadius: 4 }} />
              <div style={{ height: 14, background: 'var(--line)', width: '70%', marginBottom: 6, borderRadius: 4 }} />
              <div style={{ height: 12, background: 'var(--line)', width: '30%', borderRadius: 4 }} />
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
    <div className="products-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card group relative">
          <Link
            href={`/products/${product.handle || product.id}`}
            className="product-media block"
          >
            {product.thumbnail ? (
              <OptimizedImage
                src={product.thumbnail}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[var(--soft)]" />
            )}
            <span className="product-badge">New</span>
          </Link>
          {/* Wishlist */}
          <div className="product-wish">
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
          <div className="product-info">
            <p className="product-cat">
              {product.subtitle || product.collection?.title || 'Kvastram'}
            </p>
            <Link href={`/products/${product.handle || product.id}`}>
              <h3 className="product-name truncate" title={product.title}>{product.title}</h3>
            </Link>
            <div className="product-row">
              <span className="price">{getPrice(product)}</span>
              <button
                className="mini-cart"
                onClick={(e) => handleAddToCart(e, product)}
                aria-label={addedId === product.id ? 'Added to cart' : 'Add to cart'}
              >
                {addedId === product.id ? '✓' : '+'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default React.memo(ProductCarousel);
