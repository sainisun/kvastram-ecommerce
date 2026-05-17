"use client";

import React, { useState } from 'react';
import type { MoneyAmount, Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { useNotification } from '@/context/notification-context';
import { useShop } from '@/context/shop-context';
import { ProductCard } from '@/components/products/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getProductDisplayTitle } from '@/lib/product-title';

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
  const loading = externalLoading === true;

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>, product: Product) => {
    event.preventDefault();
    if (!product.variants || product.variants.length === 0) {
      showNotification('error', 'Product unavailable');
      return;
    }

    const variant = product.variants[0];
    const prices = variant.prices || [];
    const inrPrice =
      prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') ||
      prices[0];

    if (!inrPrice) {
      showNotification('error', 'Price unavailable for this region');
      return;
    }

    addItem({
      id: variant.id,
      variantId: variant.id,
      quantity: 1,
      title: getProductDisplayTitle(product.title),
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
    const variant = product.variants?.[0];
    const prices = variant?.prices || [];
    const inrPrice =
      prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') ||
      prices[0];

    if (!inrPrice) {
      return { label: 'Contact for price', compareAtLabel: null };
    }

    return {
      label: formatPrice(inrPrice.amount),
      compareAtLabel:
        variant?.compare_at_price && variant.compare_at_price > inrPrice.amount
          ? formatPrice(variant.compare_at_price)
          : null,
    };
  };

  if (loading) {
    return (
      <div className="products-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="product-card animate-pulse">
            <div className="product-media bg-[var(--ds-surface-soft)]" />
            <div className="product-info">
              <div className="skeleton-line skeleton-line-brand" />
              <div className="skeleton-line skeleton-line-name" />
              <div className="skeleton-line skeleton-line-price" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <EmptyState title="No products found." className="product-empty-state" />;
  }

  return (
    <div className="products-grid">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          price={getPrice(product)}
          index={index}
          added={addedId === product.id}
          currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
          categoryLabel={product.subtitle || product.collection?.title || 'Kvastram'}
          showQuickView={false}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}

export default React.memo(ProductCarousel);
