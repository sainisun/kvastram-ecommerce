'use client';

import { Heart, Search, User, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

interface ActionsRightProps {
  onSearchOpen: () => void;
  onCartOpen: () => void;
}

export function ActionsRight({ onSearchOpen, onCartOpen }: ActionsRightProps) {
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();

  const iconCls =
    'relative flex h-9 w-9 items-center justify-center rounded-full text-[#3d3a36] transition-colors hover:bg-white/60 hover:text-[#1a1714] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c94e2a]';

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={onSearchOpen}
        className={iconCls}
        aria-label="Search"
      >
        <Search size={20} strokeWidth={1.4} />
      </button>

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
          <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#c94e2a] px-0.5 text-[8px] font-medium text-white ring-[1.5px] ring-[#fbf2df]">
            {wishlistCount > 9 ? '9+' : wishlistCount}
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={onCartOpen}
        className={iconCls}
        aria-label={`Cart, ${totalItems} items`}
      >
        <ShoppingBag size={20} strokeWidth={1.4} />
        {totalItems > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#c94e2a] px-0.5 text-[8px] font-medium text-white ring-[1.5px] ring-[#fbf2df]">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </button>
    </div>
  );
}
