"use client";

import React, { useEffect, useState } from 'react';
import type { MoneyAmount, Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useShop } from '@/context/shop-context';
import { useWholesale } from '@/context/wholesale-context';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import OptimizedImage from '@/components/ui/OptimizedImage';
import WishlistButton from '@/components/ui/WishlistButton';
import { useCurrency } from '@/context/currency-context';
import { buildProductImageAlt } from '@/lib/seo';
import { getProductDisplayTitle } from '@/lib/product-title';
import Link from 'next/link';

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
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null
  );
  const products = initialProducts;
  const resolvedLoading = externalLoading === true;
  const gridClassName =
    density === 'compact'
      ? 'products-grid compact'
      : 'products-grid';

  useEffect(() => {
    if (
      wholesaleInfo?.hasWholesaleAccess &&
      products.length > 0 &&
      fetchPrices
    ) {
      const variantIds = products
        .map((product) => product.variants?.[0]?.id)
        .filter(Boolean) as string[];

      if (variantIds.length > 0) {
        fetchPrices(variantIds).catch(console.error);
      }
    }
  }, [wholesaleInfo, products, fetchPrices]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
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
    const prices = product.variants?.[0]?.prices || [];
    const inrPrice =
      prices.find((money: MoneyAmount) => money.currency_code?.toLowerCase() === 'inr') ||
      prices[0];

    if (!inrPrice) {
      return { price: 'Contact for price', isWholesale: false, savings: 0 };
    }

    const retailPrice = inrPrice.amount;
    const variantId = product.variants?.[0]?.id;

    if (variantId && wholesaleInfo?.hasWholesaleAccess) {
      const wholesale = getWholesalePrice(variantId, retailPrice);
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
    };
  };

  if (resolvedLoading) {
    return (
      <div className={gridClassName}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="product-card">
            <div
              className="product-media animate-pulse"
              style={{
                background:
                  'linear-gradient(90deg, #ede9e4 25%, #e5e0da 50%, #ede9e4 75%)',
                backgroundSize: '200% 100%',
              }}
            />
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
      <div className="product-empty-state">
        {emptyMessage}
      </div>
    );
  }

  const renderedItems: React.ReactNode[] = [];

  products.forEach((product, index) => {
    const isNew = index < 4;
    const isOnSale = !!(
      product.variants?.[0]?.compare_at_price &&
      product.variants[0].compare_at_price >
        (product.variants[0].prices?.[0]?.amount || 0)
    );
    const stockQty = product.variants?.[0]?.inventory_quantity || 0;
    const isLowStock = stockQty > 0 && stockQty <= 5;
    const secondImage = product.images?.[1]?.url;
    const priceInfo = getPrice(product);
    const displayTitle = getProductDisplayTitle(product.title);

    renderedItems.push(
      <article key={product.id} className="product-card group">
        <div className="product-media">
          <Link
            href={`/products/${product.handle || product.id}`}
            className="relative block h-full w-full"
            aria-label={`View ${displayTitle}`}
          >
          {product.thumbnail ? (
            <OptimizedImage
              src={product.thumbnail}
              alt={buildProductImageAlt(product, 0)}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="product-no-image flex h-full w-full items-center justify-center bg-[var(--soft)]">
              No Image
            </div>
          )}

          {secondImage ? (
            <OptimizedImage
              src={secondImage}
              alt={buildProductImageAlt(product, 1)}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="absolute inset-0 object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          ) : null}

          {isNew && !isOnSale ? <span className="product-badge">New</span> : null}
          {isOnSale ? <span className="product-badge sale">Sale</span> : null}
          {isLowStock ? (
            <span className="product-badge low-stock">Almost Gone</span>
          ) : null}

          </Link>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="quick-view-btn"
            aria-label={`Quick view ${displayTitle}`}
          >
            Quick View
          </button>
        </div>

        <div className="product-wish">
          <WishlistButton
            productId={product.id}
            title={displayTitle}
            price={product.variants?.[0]?.prices?.[0]?.amount || 0}
            currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
            thumbnail={product.thumbnail || undefined}
            handle={product.handle || product.id}
            variantId={product.variants?.[0]?.id}
            size="sm"
          />
        </div>

        <div className="product-info">
          <p className="product-cat">
            {product.collection?.title || 'Kvastram'}
          </p>
          <Link href={`/products/${product.handle || product.id}`}>
            <h3 className="product-name" title={displayTitle}>
              {displayTitle}
            </h3>
          </Link>

          <div className="product-row">
            <div className="flex items-center gap-1">
              {priceInfo.isWholesale ? (
                <span className="wholesale-price">
                  Wholesale · {priceInfo.price}
                </span>
              ) : (
                <>
                  <span className="price">{priceInfo.price}</span>
                  {(() => {
                    const variant = product.variants?.[0];
                    const compareAt = variant?.compare_at_price;
                    const inrPrices = variant?.prices || [];
                    const inrPriceAmt =
                      (inrPrices.find((p: MoneyAmount) => p.currency_code?.toLowerCase() === 'inr') || inrPrices[0])?.amount || 0;
                    if (compareAt && compareAt > inrPriceAmt) {
                      return <span className="orig">{formatPrice(compareAt)}</span>;
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
            <button
              onClick={(e) => handleAddToCart(e, product)}
              className="mini-cart"
              aria-label={addedId === product.id ? 'Added to cart' : 'Add to cart'}
            >
              {addedId === product.id ? '✓' : '+'}
            </button>
          </div>
        </div>
      </article>
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
            <div className="relative aspect-[16/10] overflow-hidden bg-[var(--soft)]">
              {spotlight.custom_image_url || spotlightProduct.thumbnail ? (
                <OptimizedImage
                  src={spotlight.custom_image_url || spotlightProduct.thumbnail || ''}
                  alt={buildProductImageAlt(spotlightProduct, 0)}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              {spotlight.badge_text ? (
                <span className="spotlight-badge absolute left-4 top-4 z-10 rounded-[var(--radius-xs)] bg-white/90 px-3 py-1">
                  {spotlight.badge_text}
                </span>
              ) : null}
            </div>
            <div className="space-y-3 bg-[var(--cream)] px-4 py-5">
              <div>
                <p className="spotlight-eyebrow">
                  Spotlight Pick
                </p>
                <h3 className="spotlight-title mt-2">
                  {spotlightProduct.title}
                </h3>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="spotlight-price">
                  {spotlightPrice.price}
                </p>
              <span className="spotlight-action inline-flex items-center rounded-[var(--radius-xs)] bg-[var(--ink)] px-5 py-2">
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
      <div className={gridClassName}>
        {renderedItems}
      </div>
      <QuickViewModal
        product={quickViewProduct || ({} as Product)}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}

export default React.memo(ProductGrid);
