'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PromoBar } from './PromoBar';
import { HeaderMain } from './HeaderMain';
import { SearchBar } from './SearchBar';
import { MegaMenu } from './MegaMenu';
import { MobileTopBar } from './mobile/MobileTopBar';
import { CategoryPills } from './mobile/CategoryPills';
import { MobileDrawer } from './mobile/MobileDrawer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/search/SearchOverlay';

interface Collection {
  id: string;
  name: string;
  handle: string;
  status?: string;
  show_in_megamenu?: boolean;
  display_order?: number;
}

export function SiteHeader() {
  const [isSticky, setIsSticky] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedDrawerItem, setExpandedDrawerItem] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  const megaLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sticky scroll detection
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 32);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch collections for mega menu
  useEffect(() => {
    import('@/lib/api').then(({ api }) => {
      api.getCollections().then((data: { collections?: Collection[] }) => {
        setCollections(data.collections ?? []);
      }).catch(() => {});
    });
  }, []);

  const handleMegaEnter = useCallback((label: string) => {
    if (megaLeaveTimer.current) clearTimeout(megaLeaveTimer.current);
    setActiveMega(label);
  }, []);

  const handleMegaLeave = useCallback(() => {
    megaLeaveTimer.current = setTimeout(() => setActiveMega(null), 180);
  }, []);

  const handleToggleDrawerItem = useCallback((label: string) => {
    setExpandedDrawerItem((prev) => (prev === label ? null : label));
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setExpandedDrawerItem(null);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white" onMouseLeave={handleMegaLeave}>
        {/* PromoBar — hidden when sticky */}
        <PromoBar isSticky={isSticky} />

        {/* Desktop header */}
        <HeaderMain
          activeMega={activeMega}
          onMegaEnter={handleMegaEnter}
          onMegaLeave={handleMegaLeave}
          onSearchOpen={() => setSearchOpen(true)}
          onCartOpen={() => setCartOpen(true)}
        />

        {/* Desktop search bar */}
        <div className="hidden md:block relative">
          <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>

        {/* Desktop mega menu */}
        <div className="hidden md:block relative">
          <MegaMenu
            isOpen={activeMega !== null}
            onClose={() => setActiveMega(null)}
            collections={collections}
          />
        </div>

        {/* Mobile top bar */}
        <MobileTopBar
          isDrawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen((v) => !v)}
          onSearchOpen={() => setSearchOpen(true)}
          onCartOpen={() => setCartOpen(true)}
        />

        {/* Mobile category pills — always visible */}
        <CategoryPills />
      </header>

      {/* Mobile drawer — outside header to escape stacking context */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        expandedItem={expandedDrawerItem}
        onToggleItem={handleToggleDrawerItem}
      />

      {/* Mobile search overlay */}
      <div className="md:hidden">
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>

      {/* Cart drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
