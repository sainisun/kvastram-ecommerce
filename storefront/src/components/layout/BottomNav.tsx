'use client';

import { usePathname } from 'next/navigation';
import { Clapperboard, Home, LayoutGrid, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BottomNav() {
  const pathname = usePathname();
  const [isReelPlayerOpen, setIsReelPlayerOpen] = useState(false);

  useEffect(() => {
    const syncReelPlayerState = () => {
      setIsReelPlayerOpen(
        document.body.classList.contains('reel-player-open')
      );
    };

    syncReelPlayerState();

    const observer = new MutationObserver(syncReelPlayerState);
    observer.observe(document.body, {
      attributeFilter: ['class'],
      attributes: true,
    });
    window.addEventListener('reel-player-state-change', syncReelPlayerState);

    return () => {
      observer.disconnect();
      window.removeEventListener(
        'reel-player-state-change',
        syncReelPlayerState
      );
    };
  }, []);

  const isVisible =
    !isReelPlayerOpen &&
    !pathname?.startsWith('/checkout') &&
    !pathname?.startsWith('/admin');

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      active: pathname === '/',
      badge: 0,
    },
    {
      href: '/products',
      icon: LayoutGrid,
      label: 'Shop',
      active:
        pathname?.startsWith('/categories') ||
        pathname?.startsWith('/collections') ||
        pathname?.startsWith('/products'),
      badge: 0,
    },
    {
      href: '/reels',
      icon: Clapperboard,
      label: 'Reels',
      active: pathname?.startsWith('/reels'),
      badge: 0,
    },
    {
      href: '/account',
      icon: User,
      label: 'Account',
      active: pathname?.startsWith('/account'),
      badge: 0,
    },
  ];

  if (isReelPlayerOpen) {
    return null;
  }

  return (
    <>
      {/* Spacer */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Bottom Navigation Bar */}
      <nav
        className={`mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[45] border-t border-border-subtle bg-surface-paper/95 backdrop-blur-md pointer-events-auto transition-transform duration-300 md:hidden ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`mobile-bottom-nav-link relative flex min-h-[var(--ds-control-md)] min-w-[52px] flex-col items-center justify-center px-[var(--ds-space-xs)] py-[var(--ds-space-xs)] transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted hover:text-secondary'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                  {/* Badge */}
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-inverse text-body-xs font-bold rounded-full flex items-center justify-center leading-token-tight">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-body-xs mt-1 font-medium tracking-token-wide ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`}
                >
                  {item.label}
                </span>
                {/* Active indicator dot */}
                {isActive && (
                  <span className="mobile-bottom-nav-indicator absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
