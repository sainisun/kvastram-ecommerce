'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui/Button';

interface WishlistButtonProps {
  productId: string;
  title: string;
  price: number;
  currency?: string;
  thumbnail?: string;
  handle: string;
  variantId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function WishlistButton({
  productId,
  title,
  price,
  currency = 'USD',
  thumbnail,
  handle,
  variantId,
  className = '',
  size = 'md',
  showLabel = false,
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Wholesale wishlist persistence is intentionally deferred until the account API is available.
    // Keep the control responsive without depending on missing storefront-only contexts.
    void productId;
    void variantId;
    void title;
    void price;
    void currency;
    void thumbnail;
    void handle;
    setIsWishlisted((current) => !current);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const buttonSizes = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  } as const;

  const label = isWishlisted ? 'Remove from wishlist' : 'Add to wishlist';

  if (showLabel) {
    return (
      <Button
        type="button"
        onClick={handleClick}
        variant="ghost"
        size={buttonSizes[size]}
        className={cn(
          isWishlisted
            ? 'text-error hover:brightness-95'
            : 'text-secondary hover:text-error',
          className
        )}
        aria-label={label}
        title={label}
        leadingIcon={(
          <Heart
            size={iconSizes[size]}
            strokeWidth={isWishlisted ? 2.5 : 1.5}
            className={cn(
              'transition-transform duration-200',
              isWishlisted ? 'fill-current' : 'hover:scale-110'
            )}
          />
        )}
      >
        {isWishlisted ? 'Saved' : 'Save'}
      </Button>
    );
  }

  return (
    <IconButton
      type="button"
      onClick={handleClick}
      variant="ghost"
      size={size}
      className={cn(
        'rounded-full transition-all duration-200',
        isWishlisted
          ? 'bg-[var(--ds-danger-bg)] text-error hover:brightness-95'
          : 'bg-[var(--ds-surface-paper)]/90 text-muted hover:bg-[var(--ds-surface-paper)] hover:text-error',
        sizeClasses[size],
        className
      )}
      aria-label={label}
      title={label}
    >
      <Heart
        size={iconSizes[size]}
        strokeWidth={isWishlisted ? 2.5 : 1.5}
        className={cn(
          'transition-transform duration-200',
          isWishlisted ? 'fill-current' : 'hover:scale-110'
        )}
      />
    </IconButton>
  );
}
