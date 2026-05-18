'use client';

import type React from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import { buildProductImageAlt } from '@/lib/seo';
import { getProductDisplayTitle } from '@/lib/product-title';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/ui/OptimizedImage';
import WishlistButton from '@/components/ui/WishlistButton';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Button, IconButton } from '@/components/ui/Button';
import { Check, ShoppingBag } from 'lucide-react';

export interface ProductCardPrice {
  label: string;
  isWholesale?: boolean;
  compareAtLabel?: string | null;
}

interface ProductCardProps {
  product: Product;
  price: ProductCardPrice;
  index?: number;
  added?: boolean;
  currency?: string;
  categoryLabel?: string;
  showQuickView?: boolean;
  onAddToCart: (event: React.MouseEvent<HTMLButtonElement>, product: Product) => void;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({
  product,
  price,
  index = 0,
  added = false,
  currency = 'USD',
  categoryLabel,
  showQuickView = true,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const displayTitle = getProductDisplayTitle(product.title);
  const href = `/products/${product.handle || product.id}`;
  const firstVariant = product.variants?.[0];
  const stockQty = firstVariant?.inventory_quantity || 0;
  const isNew = index < 4;
  const isOnSale = Boolean(price.compareAtLabel);
  const isLowStock = stockQty > 0 && stockQty <= 5;
  const secondImage = product.images?.[1]?.url;

  return (
    <article className="product-card group">
      <div className="product-media">
        <Link
          href={href}
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
            <div className="product-no-image flex h-full w-full items-center justify-center bg-[var(--ds-surface-soft)]">
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

          <div className="absolute left-[9px] top-[9px] z-10 flex max-w-[calc(100%-58px)] flex-col items-start gap-1.5">
            {isNew && !isOnSale ? (
              <Badge className="rounded-full px-2 py-1">New</Badge>
            ) : null}
            {isOnSale ? (
              <Badge variant="danger" className="rounded-full px-2 py-1">
                Sale
              </Badge>
            ) : null}
            {isLowStock ? (
              <Badge variant="accent" className="rounded-full px-2 py-1">
                Almost Gone
              </Badge>
            ) : null}
          </div>
        </Link>

        {showQuickView && onQuickView ? (
          <Button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onQuickView(product);
            }}
            variant="secondary"
            size="sm"
            className="product-card-quick-view"
            aria-label={`Quick view ${displayTitle}`}
          >
            Quick View
          </Button>
        ) : null}
      </div>

      <div className="product-wish">
        <WishlistButton
          productId={product.id}
          title={displayTitle}
          price={firstVariant?.prices?.[0]?.amount || 0}
          currency={currency}
          thumbnail={product.thumbnail || undefined}
          handle={product.handle || product.id}
          variantId={firstVariant?.id}
          size="sm"
        />
      </div>

      <div className="product-info">
        <p className="product-cat">{categoryLabel || product.collection?.title || product.subtitle || 'Kvastram'}</p>
        <Link href={href}>
          <h3 className="product-name" title={displayTitle}>
            {displayTitle}
          </h3>
        </Link>

        <div className="product-row">
          <PriceDisplay
            price={price.label}
            compareAtPrice={price.compareAtLabel}
            prefix={price.isWholesale ? 'Wholesale -' : undefined}
            variant="product-card"
            priceClassName={price.isWholesale ? 'wholesale-price' : undefined}
          />
          <IconButton
            type="button"
            onClick={(event) => onAddToCart(event, product)}
            variant={added ? 'primary' : 'ghost'}
            size="sm"
          className="product-card-cart-button"
          aria-label={added ? 'Added to cart' : 'Add to cart'}
        >
            {added ? (
              <Check aria-hidden="true" size={16} strokeWidth={2} />
            ) : (
              <ShoppingBag aria-hidden="true" size={15} strokeWidth={1.9} />
            )}
          </IconButton>
        </div>
      </div>
    </article>
  );
}

interface CompactProductCardProps {
  title: string;
  href: string;
  thumbnail?: string | null;
  priceLabel?: string;
  imageAlt?: string;
  imageSizes?: string;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  priceClassName?: string;
  onClick?: () => void;
}

export function CompactProductCard({
  title,
  href,
  thumbnail,
  priceLabel,
  imageAlt,
  imageSizes = '(max-width: 768px) 50vw, 16vw',
  className,
  imageClassName,
  titleClassName,
  priceClassName,
  onClick,
}: CompactProductCardProps) {
  return (
    <Link href={href} onClick={onClick} className={cn('group block', className)}>
      <div
        className={cn(
          'relative mb-3 aspect-[3/4] overflow-hidden rounded-sm bg-[var(--ds-surface-soft)]',
          imageClassName
        )}
      >
        {thumbnail ? (
          <OptimizedImage
            src={thumbnail}
            alt={imageAlt || title}
            fill
            sizes={imageSizes}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="recently-empty-image flex h-full w-full items-center justify-center">
            No Image
          </div>
        )}
      </div>
      <h3
        className={cn('recently-name line-clamp-1 transition-colors', titleClassName)}
        title={title}
      >
        {title}
      </h3>
      {priceLabel ? (
        <PriceDisplay
          as="p"
          price={priceLabel}
          variant="compact"
          className="mt-1"
          priceClassName={cn('recently-price', priceClassName)}
        />
      ) : null}
    </Link>
  );
}
