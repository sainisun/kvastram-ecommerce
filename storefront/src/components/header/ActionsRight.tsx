'use client';

import { Heart, Search, User, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { IconButton } from '@/components/ui/Button';

interface ActionsRightProps {
  onSearchOpen: () => void;
  onCartOpen: () => void;
}

export function ActionsRight({ onSearchOpen, onCartOpen }: ActionsRightProps) {
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();

  const iconCls =
    'relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--ds-text-secondary)] transition-colors hover:bg-[rgba(255,255,255,0.6)] hover:text-[var(--ds-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)]';

  return (
    <div className="flex items-center justify-end gap-1.5">
      <IconButton
        type="button"
        onClick={onSearchOpen}
        variant="ghost"
        size="sm"
        className={iconCls}
        aria-label="Search"
      >
        <Search size={20} strokeWidth={1.4} />
      </IconButton>

      <Link href="/account" className={iconCls} aria-label="My Account">
        <User size={20} strokeWidth={1.4} />
      </Link>

      <Link
        href="/wishlist"
        className={iconCls}
        aria-label={`Wishlist, ${wishlistCount} items`}
      >
        <Heart size={20} strokeWidth={1.4} />
        {wishlistCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--ds-accent-primary)] px-0.5 text-[8px] font-medium text-[var(--ds-text-inverse)] ring-[1.5px] ring-[var(--ds-surface-parchment)]">
            {wishlistCount > 9 ? '9+' : wishlistCount}
          </span>
        )}
      </Link>

      <IconButton
        type="button"
        onClick={onCartOpen}
        variant="ghost"
        size="sm"
        className={iconCls}
        aria-label={`Cart, ${totalItems} items`}
      >
        <ShoppingBag size={20} strokeWidth={1.4} />
        {totalItems > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--ds-accent-primary)] px-0.5 text-[8px] font-medium text-[var(--ds-text-inverse)] ring-[1.5px] ring-[var(--ds-surface-parchment)]">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </IconButton>
    </div>
  );
}
