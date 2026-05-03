'use client';

import { Search, User, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';

interface ActionsRightProps {
  onSearchOpen: () => void;
  onCartOpen: () => void;
}

export function ActionsRight({ onSearchOpen, onCartOpen }: ActionsRightProps) {
  const { totalItems } = useCart();
  const { currentRegion } = useShop();

  const iconCls = 'text-[#3d3a36] hover:text-[#1a1714] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c94e2a]';

  return (
    <div className="flex items-center justify-end gap-5">
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

      <button
        type="button"
        onClick={onCartOpen}
        className={`${iconCls} relative`}
        aria-label={`Cart, ${totalItems} items`}
      >
        <ShoppingBag size={20} strokeWidth={1.4} />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#c94e2a] text-white text-[8px] font-medium rounded-full flex items-center justify-center ring-[1.5px] ring-white">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </button>

      {/* Divider */}
      <span className="w-px h-5 bg-[#d8d2c8]" aria-hidden="true" />

      {/* Locale */}
      <span className="font-[family-name:var(--font-ui)] text-[11px] text-[#7a7570] hover:text-[#3d3a36] transition-colors cursor-default select-none">
        {currentRegion?.currency_code === 'INR' ? 'IN · ₹' : currentRegion?.currency_code ?? 'IN · ₹'}
      </span>
    </div>
  );
}
