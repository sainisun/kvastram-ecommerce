'use client';

import {
  ShoppingBag,
  Globe,
  ChevronDown,
  Search,
  User,
  Menu,
  Heart,
  X,
} from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchOverlay from '@/components/search/SearchOverlay';
import MobileMenu from '@/components/layout/MobileMenu';
import CartDrawer from '@/components/layout/CartDrawer';

interface NavLink {
  label: string;
  url: string;
  order: number;
  highlight?: boolean;
}

// DEFAULT FALLBACK VALUES - Used if API fails or returns empty
const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Home', url: '/', order: 1 },
  { label: 'New Arrivals', url: '/products?sort=newest', order: 2 },
  { label: 'Shop', url: '/products', order: 3 },
  {
    label: 'Plus Size',
    url: '/products?tag_id=plus-size',
    order: 4,
    highlight: true,
  },
  { label: 'Collections', url: '/collections', order: 5 },
  { label: 'Sale', url: '/sale', order: 6, highlight: true },
  { label: 'About', url: '/about', order: 7 },
  { label: 'Contact', url: '/contact', order: 8 },
];

const DEFAULT_QUICK_LINKS: NavLink[] = [
  { label: 'Bestsellers', url: '/products?tag=bestseller', order: 1 },
  { label: 'Gift Cards', url: '/gift-cards', order: 2 },
  { label: 'New In', url: '/products?sort=newest', order: 3 },
];

export function Header() {
  const { currentRegion, regions, setRegion } = useShop();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRegionMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuRef]);

  const [categories, setCategories] = useState<
    Array<{
      id: string;
      name: string;
      slug: string;
      image?: string;
      children?: Array<{
        id: string;
        name: string;
        slug: string;
        image?: string;
      }>;
    }>
  >([]);
  const [showShopMenu, setShowShopMenu] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLink[]>(DEFAULT_NAV_LINKS);
  const [quickLinks, setQuickLinks] = useState<NavLink[]>(DEFAULT_QUICK_LINKS);

  // Check localStorage for dismissed announcement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('kvastram_announcement_dismissed');
      if (dismissed === 'true') {
        setAnnouncementDismissed(true);
      }
    }
  }, []);

  const handleDismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    localStorage.setItem('kvastram_announcement_dismissed', 'true');
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ api: apiModule }] = await Promise.all([import('@/lib/api')]);

        // Fetch categories
        const categoriesData = await apiModule.getCategories();
        setCategories(categoriesData.categories || []);

        // Fetch homepage settings (includes nav_links and quick_links)
        const settingsData = await apiModule.getHomepageSettings();
        const settings = settingsData.settings || {};

        setAnnouncementText(settings.announcement_bar_text || '');
        setAnnouncementEnabled(settings.announcement_bar_enabled || false);

        // Parse nav_links from JSON
        if (settings.nav_links) {
          try {
            const parsed = JSON.parse(settings.nav_links);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNavLinks(
                parsed.sort((a: NavLink, b: NavLink) => a.order - b.order)
              );
            }
          } catch (e) {
            console.error('Error parsing nav_links:', e);
            // Uses DEFAULT_NAV_LINKS
          }
        }

        // Parse quick_links from JSON
        if (settings.quick_links) {
          try {
            const parsed = JSON.parse(settings.quick_links);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setQuickLinks(
                parsed.sort((a: NavLink, b: NavLink) => a.order - b.order)
              );
            }
          } catch (e) {
            console.error('Error parsing quick_links:', e);
            // Uses DEFAULT_QUICK_LINKS
          }
        }
      } catch (error) {
        console.error('Error fetching header data:', error);
        // Uses DEFAULT values (already set in useState)
      }
    }
    fetchData();
  }, []);

  // Scroll listener for smart sticky header & shrinking
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          setIsScrolled(currentScrollY > 50);

          if (currentScrollY > lastScrollY && currentScrollY > 150) {
            setScrollDirection('down');
          } else if (currentScrollY < lastScrollY) {
            setScrollDirection('up');
          }

          lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-100 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Announcement Strip — Premium with shimmer & dismiss */}
        {announcementEnabled && announcementText && !announcementDismissed && (
          <div className="announcement-bar text-white text-[10px] uppercase tracking-widest overflow-hidden h-8 flex items-center">
            <div className="animate-marquee">
              {[...Array(4)].map((_, i) => (
                <span key={i} className="px-8 whitespace-nowrap">
                  <span className="ticker-shimmer font-medium">
                    {announcementText}
                  </span>
                  <span className="ticker-gem">✦</span>
                </span>
              ))}
            </div>
            <button
              onClick={handleDismissAnnouncement}
              className="announcement-dismiss"
              aria-label="Dismiss announcement"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-500 ${
            isScrolled ? 'h-14' : 'h-[72px]'
          }`}
        >
          {/* Mobile Header Layout */}
          <div className="flex items-center justify-between w-full md:hidden relative px-2">
            {/* Left: Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 min-h-[44px] min-w-[44px] text-stone-900 hover:text-stone-600 transition-colors rounded flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>

            {/* Center: Logo */}
            <Link
              href="/"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-xl tracking-[0.2em] font-light text-stone-900"
            >
              KVASTRAM
            </Link>

            {/* Right: Search & Cart */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="p-2 min-h-[44px] min-w-[44px] text-stone-900 hover:text-stone-600 transition-colors flex items-center justify-center"
                aria-label="Search"
                style={{ touchAction: 'manipulation' }}
              >
                <Search size={22} />
              </button>
              <button
                type="button"
                onClick={() => setShowCartDrawer(true)}
                className="p-2 min-h-[44px] min-w-[44px] text-stone-900 hover:text-stone-600 transition-colors relative flex items-center justify-center"
                aria-label="Open cart"
              >
                <ShoppingBag size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-stone-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Header Layout */}
          <div className="hidden md:flex items-center justify-between w-full">
            {/* Logo — Premium with motif */}
            <Link href="/" className="nav-logo-premium">
              <span className="logo-motif">◆</span>
              KVASTRAM
            </Link>

            {/* Nav - Desktop */}
            <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
              {navLinks.map((link, index) => {
                const isActive =
                  pathname === link.url ||
                  (link.url !== '/' &&
                    pathname.startsWith(link.url.split('?')[0]));

                if (link.label === 'Shop') {
                  return (
                    <div
                      key={link.label}
                      className="relative group"
                      onMouseEnter={() => setShowShopMenu(true)}
                      onMouseLeave={() => setShowShopMenu(false)}
                      onFocus={() => setShowShopMenu(true)}
                    >
                      <button
                        className={`nav-link-premium nav-link-stagger flex items-center gap-1 py-2 focus:outline-none rounded ${isActive ? 'active text-stone-900' : ''}`}
                        style={{ animationDelay: `${index * 60}ms` }}
                        aria-label="Shop menu"
                        aria-expanded={showShopMenu}
                        aria-haspopup="true"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowShopMenu(false);
                          }
                        }}
                      >
                        {link.label}
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${showShopMenu ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {showShopMenu && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-[900px] max-w-[92vw] bg-white shadow-2xl border border-stone-100 rounded-sm overflow-hidden mega-menu-enter">
                          <div className="grid grid-cols-12 min-h-[340px]">
                            {/* Left: Categories with Subcategories */}
                            <div className="col-span-5 py-6 px-6 border-r border-stone-100">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">
                                Categories
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                {categories.slice(0, 8).map((cat, idx) => (
                                  <div
                                    key={cat.id}
                                    className="mega-col-stagger"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                  >
                                    <Link
                                      href={`/products?category_id=${cat.id}`}
                                      className="text-sm font-semibold text-stone-800 hover:text-black transition-colors py-1.5 block border-l-2 border-transparent hover:border-amber-500 pl-2 -ml-2"
                                      onClick={() => setShowShopMenu(false)}
                                      onMouseEnter={() =>
                                        setHoveredCategory(cat.id)
                                      }
                                    >
                                      {cat.name}
                                    </Link>
                                    {/* Subcategories */}
                                    {cat.children &&
                                      cat.children.length > 0 && (
                                        <ul className="mb-2">
                                          {cat.children
                                            .slice(0, 4)
                                            .map((child) => (
                                              <li key={child.id}>
                                                <Link
                                                  href={`/products?category_id=${child.id}`}
                                                  className="text-xs text-stone-500 hover:text-black transition-colors py-0.5 block pl-2"
                                                  onClick={() =>
                                                    setShowShopMenu(false)
                                                  }
                                                >
                                                  {child.name}
                                                </Link>
                                              </li>
                                            ))}
                                        </ul>
                                      )}
                                  </div>
                                ))}
                              </div>
                              <div className="h-px bg-stone-100 my-3" />
                              <Link
                                href="/products"
                                className="text-xs font-bold uppercase tracking-[0.15em] text-stone-900 hover:text-amber-700 transition-colors flex items-center gap-1.5"
                                onClick={() => setShowShopMenu(false)}
                              >
                                Shop All Products →
                              </Link>
                            </div>

                            {/* Center: Featured Image (changes on category hover) */}
                            <div className="col-span-4 relative overflow-hidden bg-stone-100">
                              {(() => {
                                const featured = hoveredCategory
                                  ? categories.find(
                                      (c) => c.id === hoveredCategory
                                    )
                                  : categories[0];
                                return featured ? (
                                  <>
                                    <div className="absolute inset-0">
                                      {featured.image ? (
                                        <OptimizedImage
                                          src={featured.image}
                                          alt={featured.name}
                                          fill
                                          className="object-cover transition-opacity duration-300"
                                          sizes="300px"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                                          <span className="text-stone-300 text-6xl font-serif">
                                            {featured.name?.charAt(0)}
                                          </span>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-5">
                                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 block mb-1">
                                        Featured
                                      </span>
                                      <span className="text-lg font-serif text-white font-light">
                                        {featured.name}
                                      </span>
                                    </div>
                                  </>
                                ) : null;
                              })()}
                            </div>

                            {/* Right: Quick Links + Promo */}
                            <div className="col-span-3 py-6 px-5 bg-stone-50/70">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">
                                Shop By
                              </p>
                              <div className="space-y-2.5">
                                {quickLinks.map((qLink) => (
                                  <Link
                                    key={qLink.label}
                                    href={qLink.url}
                                    className={`block text-sm transition-colors ${qLink.highlight ? 'text-amber-600 font-semibold hover:text-amber-700' : 'text-stone-700 hover:text-black font-medium'}`}
                                    onClick={() => setShowShopMenu(false)}
                                  >
                                    {qLink.label}
                                  </Link>
                                ))}
                              </div>
                              <div className="h-px bg-stone-200/60 my-4" />
                              <Link
                                href="/collections"
                                className="block text-sm font-medium text-stone-700 hover:text-black transition-colors"
                                onClick={() => setShowShopMenu(false)}
                              >
                                All Collections
                              </Link>
                              <Link
                                href="/products?sort=newest"
                                className="block text-sm font-medium text-stone-700 hover:text-black transition-colors mt-2.5"
                                onClick={() => setShowShopMenu(false)}
                              >
                                New Arrivals ✦
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.label}
                    href={link.url}
                    className={`nav-link-premium nav-link-stagger ${isActive ? 'active text-stone-900' : ''} ${link.highlight ? 'text-amber-600 font-medium' : ''}`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            {/* Actions — Premium icon bar with tooltips & glow */}
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="header-icon-wrap text-stone-600 hover:text-black p-1 min-h-[44px] min-w-[44px]"
                aria-label="Search products"
                data-tooltip="Search"
              >
                <Search size={20} />
              </button>

              <Link
                href="/account"
                className="header-icon-wrap text-stone-600 hover:text-black p-1 min-h-[44px] min-w-[44px]"
                aria-label="My Account"
                data-tooltip="Account"
              >
                <User size={20} />
              </Link>

              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                className="header-icon-wrap text-stone-600 hover:text-black relative p-1 min-h-[44px] min-w-[44px]"
                aria-label={`Wishlist with ${wishlistCount} items`}
                data-tooltip="Wishlist"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Region Selector */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowRegionMenu(!showRegionMenu)}
                  className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-black transition-colors px-3 py-1.5 rounded-full hover:bg-stone-100 focus:outline-none"
                  aria-label="Select region and currency"
                  aria-expanded={showRegionMenu}
                  aria-haspopup="true"
                  title="Select Region"
                >
                  <Globe size={20} />
                  <span className="uppercase">
                    {currentRegion?.currency_code || 'USD'}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {showRegionMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-stone-100 py-1 overflow-hidden">
                    <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase">
                      Select Region
                    </div>
                    {regions.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => {
                          setRegion(region);
                          setShowRegionMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 flex items-center justify-between group focus:outline-none ${
                          currentRegion?.id === region.id
                            ? 'text-blue-600 font-medium'
                            : 'text-stone-600'
                        }`}
                      >
                        <span>{region.name}</span>
                        <span className="text-xs font-mono text-stone-400 group-hover:text-stone-600 uppercase">
                          {region.currency_code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowCartDrawer(true)}
                className="header-icon-wrap text-stone-600 hover:text-black relative p-1"
                aria-label={`Shopping cart with ${totalItems} items`}
                data-tooltip="Cart"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    aria-label={`${totalItems} items in cart`}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlays - Rendered outside header to escape transform containing block */}
      {/* SearchOverlay - Rendered outside mobile/desktop layouts for both views */}
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        categories={categories}
        regions={regions}
        currentRegion={currentRegion}
        onRegionChange={setRegion}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
      />
    </>
  );
}
