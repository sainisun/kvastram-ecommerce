"use client";

import React, { useEffect, useState } from 'react';
import type { MoneyAmount, Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useShop } from '@/context/shop-context';
import { useWholesale } from '@/context/wholesale-context';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import { ProductCard } from '@/components/products/ProductCard';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useCurrency } from '@/context/currency-context';
import { buildProductImageAlt } from '@/lib/seo';
import { getProductDisplayTitle } from '@/lib/product-title';

interface SpotlightProduct {
  id: string;
  custom_image_url?: string | null;
  badge_text?: string | null;
  product: Product | null;
}

interface ProductGridProps {
  initialProducts?: Product[];
  loading?: boolean;
  spotlightProducts?: SpotlightProduct[];
  density?: 'grid' | 'compact';
  emptyMessage?: string;
}

interface ProductPriceInfo {
  price: string;
  isWholesale: boolean;
  savings: number;
  compareAtLabel?: string | null;
  discountPercent?: number;
}

function ProductGrid({
  initialProducts = [],
  loading: externalLoading,
  spotlightProducts = [],
  density = 'grid',
  emptyMessage = 'No products found in this collection.',
}: ProductGridProps) {
  const { currentRegion } = useShop();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const {
    wholesaleInfo,
    getPrice: getWholesalePrice,
    fetchPrices,
  } = useWholesale();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const products = initialProducts;
  const resolvedLoading = externalLoading === true;
  const gridClassName = density === 'compact' ? 'products-grid compact' : 'products-grid';

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

  if (resolvedLoading) {
    return (
      <div className={gridClassName}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="product-card">
            <div className="product-media animate-pulse bg-[var(--ds-surface-soft)]" />
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
    return (
      <EmptyState
        title={emptyMessage}
        className="product-empty-state"
      />
    );
  }

  const renderedItems: React.ReactNode[] = [];

  products.forEach((product, index) => {
    const priceInfo = getPrice(product);

    renderedItems.push(
      <ProductCard
        key={product.id}
        product={product}
        price={{
          label: priceInfo.price,
          isWholesale: priceInfo.isWholesale,
          compareAtLabel: priceInfo.compareAtLabel,
        }}
        index={index}
        added={addedId === product.id}
        currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
        categoryLabel={product.collection?.title || 'Kvastram'}
        onAddToCart={handleAddToCart}
        onQuickView={setQuickViewProduct}
      />
    );

    if (spotlightProducts.length > 0 && (index + 1) % 4 === 0) {
      const spotlightIndex = Math.floor(index / 4) % spotlightProducts.length;
      const spotlight = spotlightProducts[spotlightIndex];
      const spotlightProduct = spotlight?.product;

      if (spotlight && spotlightProduct) {
        const spotlightPrice = getPrice(spotlightProduct);

        renderedItems.push(
          <a
            key={`spotlight-${spotlight.id}-${index}`}
            href={`/products/${spotlightProduct.handle || spotlightProduct.id}`}
            className="product-spotlight md:hidden"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--ds-surface-soft)]">
              {spotlight.custom_image_url || spotlightProduct.thumbnail ? (
                <OptimizedImage
                  src={spotlight.custom_image_url || spotlightProduct.thumbnail || ''}
                  alt={buildProductImageAlt(spotlightProduct, 0)}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.60)] via-[rgba(var(--ds-black-rgb),0.10)] to-transparent" />
              {spotlight.badge_text ? (
                <Badge className="spotlight-badge absolute left-4 top-4 z-10 rounded-[var(--radius-xs)] bg-[var(--ds-surface-paper)]/90 px-3 py-1">
                  {spotlight.badge_text}
                </Badge>
              ) : null}
            </div>
            <div className="space-y-3 bg-[var(--ds-surface-parchment)] px-4 py-5">
              <div>
                <p className="spotlight-eyebrow">Spotlight Pick</p>
                <h3 className="spotlight-title mt-2">{spotlightProduct.title}</h3>
              </div>
              <div className="flex items-center justify-between gap-4">
                <PriceDisplay
                  as="p"
                  price={spotlightPrice.price}
                  variant="inline"
                  priceClassName="spotlight-price"
                />
                <span className="spotlight-action inline-flex items-center rounded-[var(--radius-xs)] bg-[var(--ds-text-primary)] px-5 py-2">
                  View
                </span>
              </div>
            </div>
          </a>
        );
      }
    }
  });

  return (
    <>
      <div className={gridClassName}>{renderedItems}</div>
      <QuickViewModal
        product={quickViewProduct || ({} as Product)}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}

export default React.memo(ProductGrid);
