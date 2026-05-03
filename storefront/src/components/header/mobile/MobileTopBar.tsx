'use client';

import { Menu, X, Search, ShoppingBag } from 'lucide-react';
import { Logo } from '../Logo';
import { useCart } from '@/context/cart-context';

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

  return (
    <div className="flex md:hidden items-center justify-between h-[54px] px-4 bg-white border-b border-[#d8d2c8]">
      <button
        onClick={onToggleDrawer}
        className="w-10 h-10 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#c94e2a]"
        aria-label={isDrawerOpen ? 'Close navigation' : 'Open navigation'}
      >
        {isDrawerOpen ? (
          <X size={20} strokeWidth={1.8} className="text-[#c94e2a]" />
        ) : (
          <Menu size={20} strokeWidth={1.8} className="text-[#3d3a36]" />
        )}
      </button>

      <Logo size="mobile" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSearchOpen}
          className="text-[#3d3a36] hover:text-[#1a1714] transition-colors"
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.4} />
        </button>
        <button
          type="button"
          onClick={onCartOpen}
          className="relative text-[#3d3a36] hover:text-[#1a1714] transition-colors"
          aria-label={`Cart, ${totalItems} items`}
        >
          <ShoppingBag size={20} strokeWidth={1.4} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#c94e2a] text-white text-[8px] font-medium rounded-full flex items-center justify-center ring-[1.5px] ring-white">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
