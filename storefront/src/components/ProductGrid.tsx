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
}

function ProductGrid({
  initialProducts = [],
  loading: externalLoading,
  spotlightProducts = [],
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
  const resolvedLoading = externalLoading || initialProducts.length === 0;

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
      <div className="product-grid-prem">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="prod-card-prem">
            <div
              className="prod-img-wrap-prem"
              style={{
                background:
                  'linear-gradient(90deg, #ede9e4 25%, #e5e0da 50%, #ede9e4 75%)',
                backgroundSize: '200% 100%',
              }}
            />
            <div className="prod-info-prem">
              <div
                style={{
                  height: '9px',
                  width: '60%',
                  background: 'var(--border)',
                  marginBottom: '8px',
                }}
              />
              <div
                style={{
                  height: '18px',
                  width: '80%',
                  background: 'var(--border)',
                  marginBottom: '8px',
                }}
              />
              <div
                style={{
                  height: '13px',
                  width: '30%',
                  background: 'var(--border)',
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
      <div
        style={{
          padding: '80px 0',
          textAlign: 'center',
          color: 'var(--mid)',
          fontStyle: 'italic',
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 300,
        }}
      >
        No products found in this collection.
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

    renderedItems.push(
      <div key={product.id} className="prod-card-prem group relative">
        <a
          href={`/products/${product.handle || product.id}`}
          className="block prod-img-wrap-prem"
        >
          {product.thumbnail ? (
            <OptimizedImage
              src={product.thumbnail}
              alt={buildProductImageAlt(product, 0)}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--off-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mid)',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
              }}
            >
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

          <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
            {isNew && !isOnSale ? <span className="prod-tag-prem">New</span> : null}
            {isOnSale ? <span className="prod-tag-prem sale">Sale</span> : null}
            {isLowStock ? (
              <span className="prod-tag-prem low-stock">Almost Gone</span>
            ) : null}
          </div>

        </a>

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

        <button
          onClick={(e) => handleAddToCart(e, product)}
          className="prod-quick-add-prem"
          aria-label={
            addedId === product.id ? 'Added to cart' : 'Quick Add to cart'
          }
        >
          {addedId === product.id ? 'Added' : 'Quick Add'}
        </button>

        <a
          href={`/products/${product.handle || product.id}`}
          className="prod-info-prem block"
        >
          <p className="prod-collection-prem">
            {product.collection?.title || 'Kvastram'}
          </p>
          <h3 className="prod-name-prem truncate" title={product.title}>
            {product.title}
          </h3>

          {product.avg_rating != null && product.avg_rating > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '6px',
              }}
            >
              {[1, 2, 3, 4, 5].map((item) => (
                <svg
                  key={item}
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill={
                    item <= Math.round(product.avg_rating || 0) ? '#080808' : '#ddd'
                  }
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              {product.review_count != null && product.review_count > 0 ? (
                <span style={{ fontSize: '10px', color: 'var(--mid)' }}>
                  ({product.review_count})
                </span>
              ) : null}
            </div>
          ) : null}

          {priceInfo.isWholesale ? (
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '12px',
                fontWeight: 500,
                color: '#2a7a2a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Wholesale · {priceInfo.price}
            </p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(() => {
                const variant = product.variants?.[0];
                const compareAt = variant?.compare_at_price;
                const inrPrices = variant?.prices || [];
                const inrPriceAmt =
                  (inrPrices.find((p: MoneyAmount) => p.currency_code?.toLowerCase() === 'inr') || inrPrices[0])?.amount || 0;
                if (compareAt && compareAt > inrPriceAmt) {
                  return (
                    <span
                      className="prod-price-prem"
                      style={{
                        color: 'var(--mid)',
                        textDecoration: 'line-through',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '14px',
                      }}
                    >
                      {formatPrice(compareAt)}
                    </span>
                  );
                }
                return null;
              })()}
              <p className="prod-price-prem">{priceInfo.price}</p>
            </div>
          )}
        </a>
      </div>
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
            className="product-spotlight-prem md:hidden"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
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
                <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-900">
                  {spotlight.badge_text}
                </span>
              ) : null}
            </div>
            <div className="space-y-3 bg-[#f5f0eb] px-4 py-5">
              <div>
                <p className="font-body text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                  Spotlight Pick
                </p>
                <h3 className="font-heading mt-2 text-[28px] font-semibold uppercase leading-[1.05] text-stone-900">
                  {spotlightProduct.title}
                </h3>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="font-body text-[15px] font-medium text-stone-900">
                  {spotlightPrice.price}
                </p>
              <span className="inline-flex items-center rounded-full bg-stone-900 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white">
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
    <div className="product-grid-prem">
      {renderedItems}
      <QuickViewModal
        product={quickViewProduct || ({} as Product)}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

export default React.memo(ProductGrid);
