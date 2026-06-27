'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MoneyAmount, Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useWholesale } from '@/context/wholesale-context';
import { ProductCard } from '@/components/products/ProductCard';
import { useCurrency } from '@/context/currency-context';
import { getProductDisplayTitle } from '@/lib/product-title';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';

interface ProductPriceInfo {
  price: string;
  isWholesale: boolean;
  savings: number;
  compareAtLabel?: string | null;
  discountPercent?: number;
}

export function BestSellers({
  products: initialProducts,
}: {
  products: Product[];
  state?: 'ready' | 'empty' | 'error';
}) {
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const {
    wholesaleInfo,
    getPrice: getWholesalePrice,
    fetchPrices,
  } = useWholesale();
  const [addedId, setAddedId] = useState<string | null>(null);

  const products = filterStorefrontReadyProducts(initialProducts || [], { requireSellablePrice: false });

  useEffect(() => {
    if (wholesaleInfo?.hasWholesaleAccess && products.length > 0 && fetchPrices) {
      const variantIds = products
        .map((product) => product.variants?.[0]?.id)
        .filter(Boolean) as string[];

      if (variantIds.length > 0) {
        fetchPrices(variantIds).catch(console.error);
      }
    }
  }, [wholesaleInfo, products, fetchPrices]);

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
      handle: product.handle || product.id,
    });

    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  const getPrice = (product: Product): ProductPriceInfo => {
    const variant = product.variants?.[0];
    const prices = variant?.prices || [];
    const inrPrice =
      prices.find((money: MoneyAmount) => money.currency_code?.toLowerCase() === 'inr') ||
      prices[0];

    if (!inrPrice) {
      return { price: 'Contact for price', isWholesale: false, savings: 0 };
    }

    const retailPrice = inrPrice.amount;

    if (variant?.id && wholesaleInfo?.hasWholesaleAccess) {
      const wholesale = getWholesalePrice(variant.id, retailPrice);
      if (wholesale.isWholesale) {
        return {
          price: formatPrice(wholesale.price),
          isWholesale: true,
          savings: wholesale.savings,
          discountPercent: wholesaleInfo.discountPercent,
        };
      }
    }

    return {
      price: formatPrice(inrPrice.amount),
      isWholesale: false,
      savings: 0,
      compareAtLabel:
        variant?.compare_at_price && variant.compare_at_price > inrPrice.amount
          ? formatPrice(variant.compare_at_price)
          : null,
    };
  };

  if (products.length === 0) return null;

  return (
    <section className="w-full py-home-section-mobile md:py-home-section" data-home-section="5-best-sellers">
      <div className="homepage-container">
        <div className="homepage-section-head flex justify-between items-end mb-[var(--ds-space-md)] md:mb-[var(--ds-space-md)]">
          <div>
            <p className="homepage-eyebrow text-body-xs uppercase tracking-[var(--ds-type-label-tracking)] text-[var(--ds-accent-gold)]">Chosen For You</p>
            <h2 className="text-display-sm font-display font-medium text-[var(--ds-text-primary)]">Best Sellers</h2>
          </div>
          <Link href="/collections/best-sellers" className="kv-section-link">
            View All Best Sellers →
          </Link>
        </div>
        
        <div className="[&_.product-card]:rounded-none [&_.product-card]:border-none [&_.product-card]:shadow-none [&_.product-card]:bg-transparent [&_.product-info]:py-[var(--ds-space-xs)] overflow-x-auto no-scrollbar flex gap-[1px] scroll-smooth">
          {products.map((product) => {
            const priceInfo = getPrice(product);
            return (
              <div key={product.id} className="flex-shrink-0 w-72 md:w-[316px] animate-fade-in">
                <ProductCard
                  product={product}
                  price={{
                    label: priceInfo.price,
                    compareAtLabel: priceInfo.compareAtLabel,
                    isWholesale: priceInfo.isWholesale,
                  }}
                  onAddToCart={handleAddToCart}
                  added={addedId === product.id}
                  showQuickView={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
