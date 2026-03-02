'use client';

import { useState, useEffect } from 'react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useWholesale } from '@/context/wholesale-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import type { Product, MoneyAmount } from '@/types';
import WishlistButton from '@/components/ui/WishlistButton';
import { QuickViewModal } from '@/components/product/QuickViewModal';

interface ProductGridProps {
  initialProducts?: Product[];
  loading?: boolean;
}

export default function ProductGrid({
  initialProducts = [],
  loading: externalLoading,
}: ProductGridProps) {
  const { currentRegion } = useShop();
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
  const loading = externalLoading || initialProducts.length === 0;

  // Fetch wholesale prices when products load
  useEffect(() => {
    if (
      wholesaleInfo?.hasWholesaleAccess &&
      products.length > 0 &&
      fetchPrices
    ) {
      const variantIds = products
        .map((p) => p.variants?.[0]?.id)
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

    if (!price) {
      return { price: 'Contact for price', isWholesale: false, savings: 0 };
    }

    const retailPrice = price.amount;
    const variantId = product.variants?.[0]?.id;

    if (variantId && wholesaleInfo?.hasWholesaleAccess) {
      const wholesale = getWholesalePrice(variantId, retailPrice);
      if (wholesale.isWholesale) {
        return {
          price: new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: price.currency_code?.toUpperCase() || 'USD',
          }).format(wholesale.price / 100),
          isWholesale: true,
          savings: wholesale.savings,
          discountPercent: wholesaleInfo.discountPercent,
        };
      }
    }

    return {
      price: new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: price.currency_code?.toUpperCase() || 'USD',
      }).format(price.amount / 100),
      isWholesale: false,
      savings: 0,
    };
  };

  // ─── Loading Skeleton ───
  if (loading) {
    return (
      <div className="product-grid-prem">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="prod-card-prem">
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

  // ─── Empty State ───
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

  // ─── Product Grid ───
  return (
    <div className="product-grid-prem">
      {products.map((product) => {
        const isNew = product.created_at
          ? Date.now() - new Date(product.created_at).getTime() <
            14 * 24 * 60 * 60 * 1000
          : false;
        const isOnSale = !!(
          product.variants?.[0]?.compare_at_price &&
          product.variants[0].compare_at_price >
            (product.variants[0].prices?.[0]?.amount || 0)
        );
        const stockQty = product.variants?.[0]?.inventory_quantity || 0;
        const isLowStock = stockQty > 0 && stockQty <= 5;
        const secondImage = product.images?.[1]?.url;
        const priceInfo = getPrice(product);

        return (
          <div key={product.id} className="prod-card-prem group">
            {/* ── Image Area ── */}
            <Link
              href={`/products/${product.handle || product.id}`}
              className="block prod-img-wrap-prem"
            >
              {product.thumbnail ? (
                <OptimizedImage
                  src={product.thumbnail}
                  alt={product.title}
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

              {/* Hover alternate image */}
              {secondImage && (
                <OptimizedImage
                  src={secondImage}
                  alt={`${product.title} - alternate view`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                />
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {isNew && !isOnSale && (
                  <span className="prod-tag-prem">New</span>
                )}
                {isOnSale && <span className="prod-tag-prem sale">Sale</span>}
                {isLowStock && (
                  <span className="prod-tag-prem low-stock">Almost Gone</span>
                )}
              </div>

              {/* Wishlist — fades in top-right on hover */}
              <div className="prod-wishlist-prem">
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

              {/* Quick Add — slides up from bottom on hover */}
              <button
                onClick={(e) => handleAddToCart(e, product)}
                className="prod-quick-add-prem"
                aria-label={
                  addedId === product.id ? 'Added to cart' : 'Quick Add to cart'
                }
              >
                {addedId === product.id ? '✓ Added' : 'Quick Add'}
              </button>
            </Link>

            {/* ── Product Info ── */}
            <Link
              href={`/products/${product.handle || product.id}`}
              className="prod-info-prem block"
            >
              <p className="prod-collection-prem">
                {product.collection?.title || 'Kvastram'}
              </p>
              <h3 className="prod-name-prem">{product.title}</h3>

              {/* Star rating */}
              {product.avg_rating != null && product.avg_rating > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '6px',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill={
                        i <= Math.round(product.avg_rating!)
                          ? '#080808'
                          : '#ddd'
                      }
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                  {product.review_count != null && product.review_count > 0 && (
                    <span style={{ fontSize: '10px', color: 'var(--mid)' }}>
                      ({product.review_count})
                    </span>
                  )}
                </div>
              )}

              {/* Price — wholesale or retail */}
              {priceInfo.isWholesale ? (
                <p
                  style={{
                    fontSize: '11px',
                    color: '#2a7a2a',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Wholesale · {priceInfo.price}
                </p>
              ) : (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {(() => {
                    const variant = product.variants?.[0];
                    const compareAt = variant?.compare_at_price;
                    const current = variant?.prices?.[0]?.amount || 0;
                    if (compareAt && compareAt > current) {
                      return (
                        <span
                          className="prod-price-prem"
                          style={{
                            color: 'var(--mid)',
                            textDecoration: 'line-through',
                            fontSize: '12px',
                          }}
                        >
                          {new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency:
                              variant?.prices?.[0]?.currency_code?.toUpperCase() ||
                              'USD',
                          }).format(compareAt / 100)}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  <p className="prod-price-prem">{priceInfo.price}</p>
                </div>
              )}
            </Link>
          </div>
        );
      })}

      {/* Quick View Modal — keeps existing functionality intact */}
      <QuickViewModal
        product={quickViewProduct || ({} as Product)}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
