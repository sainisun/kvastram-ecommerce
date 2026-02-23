'use client';

import Link from 'next/link';
import { Package, Heart, Clock, Headphones } from 'lucide-react';
import { useWishlist } from '@/context/wishlist-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';

export function QuickGrid() {
  const { totalItems: wishlistCount } = useWishlist();
  const { items: recentlyViewed } = useRecentlyViewed();

  const gridItems = [
    {
      href: '/account/orders',
      icon: Package,
      label: 'Orders',
      count: null,
      active: true,
    },
    {
      href: '/wishlist',
      icon: Heart,
      label: 'Wishlist',
      count: wishlistCount > 0 ? wishlistCount : null,
      active: true,
    },
    {
      href: '/products?sort=newest',
      icon: Clock,
      label: 'Recently Viewed',
      count: recentlyViewed.length > 0 ? recentlyViewed.length : null,
      active: true,
    },
    {
      href: '/contact',
      icon: Headphones,
      label: 'Help Center',
      count: null,
      active: true,
    },
  ];

  return (
    <div className="bg-white border-b border-stone-100 p-4">
      <div className="grid grid-cols-2 gap-3">
        {gridItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center p-4 border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all"
            >
              <div className="relative">
                <Icon size={22} strokeWidth={1.5} className="text-stone-600" />
                {item.count !== null && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-stone-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-stone-700 mt-2">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
