'use client';

import Link from 'next/link';
import { Menu, X, Search, ShoppingBag, Heart } from 'lucide-react';
import { Logo } from '../Logo';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { IconButton } from '@/components/ui/Button';

interface MobileTopBarProps {
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onSearchOpen: () => void;
  onCartOpen: () => void;
}

export function MobileTopBar({
  isDrawerOpen,
  onToggleDrawer,
  onSearchOpen,
  onCartOpen,
}: MobileTopBarProps) {
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();

  return (
    <div className="flex md:hidden items-center justify-between h-[54px] px-4 bg-[var(--ds-surface-paper)] border-b border-[var(--ds-border-strong)]">
      <IconButton
        type="button"
        onClick={onToggleDrawer}
        variant="ghost"
        size="md"
        className="h-10 w-10"
        aria-label={isDrawerOpen ? 'Close navigation' : 'Open navigation'}
      >
        {isDrawerOpen ? (
          <X size={20} strokeWidth={1.8} className="text-[var(--ds-accent-primary)]" />
        ) : (
          <Menu size={20} strokeWidth={1.8} className="text-[var(--ds-text-secondary)]" />
        )}
      </IconButton>

      <Logo size="mobile" />

      <div className="flex items-center gap-3">
        <IconButton
          type="button"
          onClick={onSearchOpen}
          variant="ghost"
          size="sm"
          className="text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.4} />
        </IconButton>
        <Link
          href="/wishlist"
          className="relative text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors"
          aria-label={`Wishlist, ${wishlistCount} items`}
        >
          <Heart size={20} strokeWidth={1.4} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)] text-[8px] font-medium rounded-full flex items-center justify-center ring-[1.5px] ring-[var(--ds-surface-paper)]">
              {wishlistCount > 9 ? '9+' : wishlistCount}
            </span>
          )}
        </Link>
        <IconButton
          type="button"
          onClick={onCartOpen}
          variant="ghost"
          size="sm"
          className="relative text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
          aria-label={`Cart, ${totalItems} items`}
        >
          <ShoppingBag size={20} strokeWidth={1.4} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)] text-[8px] font-medium rounded-full flex items-center justify-center ring-[1.5px] ring-[var(--ds-surface-paper)]">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </IconButton>
      </div>
    </div>
  );
}
