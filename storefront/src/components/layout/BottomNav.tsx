'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutGrid, Heart, User, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();

  const isVisible =
    !pathname?.startsWith('/checkout') && !pathname?.startsWith('/admin');

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      active: pathname === '/',
      badge: 0,
    },
    {
      href: '/collections',
      icon: LayoutGrid,
      label: 'Shop',
      active:
        pathname?.startsWith('/collections') ||
        pathname?.startsWith('/products'),
      badge: 0,
    },
    {
      href: '/cart',
      icon: ShoppingBag,
      label: 'Cart',
      active: pathname === '/cart',
      badge: totalItems,
    },
    {
      href: '/wishlist',
      icon: Heart,
      label: 'Wishlist',
      active: pathname === '/wishlist',
      badge: wishlistCount,
    },
    {
      href: '/account',
      icon: User,
      label: 'Account',
      active: pathname?.startsWith('/account'),
      badge: 0,
    },
  ];

  return (
    <>
      {/* Spacer */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Bottom Navigation Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-100 z-40 transition-transform duration-300 md:hidden ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[52px] transition-colors relative ${
                  isActive
                    ? 'text-stone-900'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                  {/* Badge */}
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-stone-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] mt-1 font-medium tracking-wide ${
                    isActive ? 'text-stone-900' : 'text-stone-400'
                  }`}
                >
                  {item.label}
                </span>
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 bg-stone-900 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
