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

interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  emoji?: string;
  header_image_url?: string;
  show_in_header?: boolean;
  display_order?: number;
  children?: HeaderCategory[];
}

interface HeaderSettings {
  announcement_bar_text?: string;
  announcement_bar_enabled?: boolean;
  nav_links?: string;
  quick_links?: string;
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
  { label: 'Bestsellers', url: '/bestsellers', order: 1 },
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
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (globalThis.window === undefined) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRegionMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuRef]);

  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [showShopMenu, setShowShopMenu] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLink[]>(DEFAULT_NAV_LINKS);
  const [quickLinks, setQuickLinks] = useState<NavLink[]>(DEFAULT_QUICK_LINKS);

  // Check localStorage for dismissed announcement
  useEffect(() => {
    if (globalThis.window !== undefined) {
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

  const closeShopMenu = () => setShowShopMenu(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { api: apiModule } = await import('@/lib/api');

        // Fetch category tree (with parent-child relationships)
        const categoriesData = await apiModule.getCategoriesTree();
        // Filter only categories with show_in_header = true, sorted by display_order
        const headerCategories = (categoriesData.categories || [])
          .filter((cat: HeaderCategory) => cat.show_in_header)
          .sort(
            (a: HeaderCategory, b: HeaderCategory) =>
              (a.display_order || 0) - (b.display_order || 0)
          );
        setCategories(headerCategories);

        // Fetch homepage settings (includes nav_links and quick_links)
        const settingsData = await apiModule.getHomepageSettings();
        const settings: HeaderSettings = settingsData.settings || {};

        setAnnouncementText(settings.announcement_bar_text || '');
        setAnnouncementEnabled(settings.announcement_bar_enabled || false);

        // Parse nav_links from JSON
        if (settings.nav_links) {
          try {
            const parsed = JSON.parse(settings.nav_links);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNavLinks(
                parsed.toSorted((a: NavLink, b: NavLink) => a.order - b.order)
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
                parsed.toSorted((a: NavLink, b: NavLink) => a.order - b.order)
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
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        globalThis.requestAnimationFrame(() => {
          const currentScrollY = globalThis.scrollY;

          setIsScrolled(currentScrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    return () => globalThis.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-[var(--line)] bg-white/95 backdrop-blur-md"
      >
        {/* Announcement Strip — Mobile-First Prototype Design */}
        {announcementEnabled && announcementText && !announcementDismissed && (
          <div className="announce flex h-[34px] items-center justify-center overflow-hidden bg-[var(--sienna)] text-white relative px-9 text-[12px] font-bold tracking-[0.08em] uppercase">
            <div className="animate-marquee whitespace-nowrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={`ticker-${i}`} className="px-8 whitespace-nowrap">
                  <span>{announcementText}</span>
                </span>
              ))}
            </div>
            <button
              onClick={handleDismissAnnouncement}
              className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-white text-[18px] p-1 cursor-pointer flex items-center justify-center"
              aria-label="Dismiss announcement"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <div className="header-inner container mx-auto">
          {/* Mobile Header Layout */}
          <div className="relative flex w-full items-center justify-between md:hidden">
            {/* Left: Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="icon-btn"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Center: Logo */}
            <Link
              href="/"
              className="logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              Kvast<span className="text-[var(--sienna)]">ram</span>
            </Link>

            {/* Right: Search & Cart */}
            <div className="header-actions">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="icon-btn"
                aria-label="Search"
                style={{ touchAction: 'manipulation' }}
              >
                <Search size={20} />
              </button>
              <button
                type="button"
                onClick={() => setShowCartDrawer(true)}
                className="icon-btn"
                aria-label="Open cart"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="badge bg-[var(--sienna)]">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Header Layout */}
          <div className="hidden w-full items-center justify-between gap-6 xl:gap-8 md:flex">
            {/* Logo */}
            <Link href="/" className="logo shrink-0">
              Kvast<span className="text-[var(--sienna)]">ram</span>
            </Link>

            {/* Nav - Desktop */}
            <nav className="font-body flex min-w-0 flex-1 items-center justify-center gap-3 text-stone-600 xl:gap-6 2xl:gap-8">
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
                      role="presentation"
                      onMouseEnter={() => setShowShopMenu(true)}
                      onMouseLeave={closeShopMenu}
                      onFocus={() => setShowShopMenu(true)}
                      onBlur={closeShopMenu}
                    >
                      <button
                        className={`flex items-center gap-1 py-2 text-[15px] font-medium transition-colors focus:outline-none rounded ${isActive ? 'text-stone-900' : 'hover:text-stone-900'}`}
                        style={{ animationDelay: `${index * 60}ms` }}
                        aria-label="Shop menu"
                        aria-expanded={showShopMenu}
                        aria-haspopup="true"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            closeShopMenu();
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
                          <div className="grid min-h-[340px] grid-cols-12">
                            {/* Left: Categories with Subcategories */}
                            <div className="col-span-5 border-r border-stone-100 px-6 py-6">
                              <p className="font-body mb-4 text-[13px] font-medium uppercase tracking-[0.08em] text-stone-400">
                                Categories
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                {categories.slice(0, 8).map((cat, idx) => (
                                  <div
                                    key={cat.id}
                                    className="mega-col-stagger"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                  >
                                    <Link
                                      href={`/collections/${cat.slug}`}
                                      className="font-body -ml-2 block border-l-2 border-transparent py-1.5 pl-2 text-[15px] font-medium text-stone-800 transition-colors hover:border-amber-500 hover:text-black"
                                      onClick={closeShopMenu}
                                      onMouseEnter={() =>
                                        setHoveredCategory(cat.id)
                                      }
                                    >
                                      {cat.emoji && (
                                        <span className="mr-2">
                                          {cat.emoji}
                                        </span>
                                      )}
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
                                                  href={`/collections/${child.slug}`}
                                                  className="font-body block py-0.5 pl-2 text-[15px] font-[300] text-stone-500 transition-colors hover:text-black"
                                                  onClick={closeShopMenu}
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
                                className="font-body flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.1em] text-stone-900 transition-colors hover:text-amber-700"
                                onClick={closeShopMenu}
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
                                const featuredImageSrc =
                                  featured?.header_image_url ?? featured?.image;
                                return featured ? (
                                  <>
                                    <div className="absolute inset-0">
                                      {featuredImageSrc ? (
                                        <OptimizedImage
                                          src={featuredImageSrc}
                                          alt={featured.name}
                                          fill
                                          className="object-cover transition-opacity duration-300"
                                          sizes="300px"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                                          <span className="text-stone-300 text-6xl font-serif">
                                            {featured.emoji ||
                                              featured.name?.charAt(0)}
                                          </span>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                      <span className="font-body mb-1 block text-[12px] font-medium uppercase tracking-[0.08em] text-white/60">
                                        Featured
                                      </span>
                                      <span className="font-heading text-[28px] font-semibold uppercase tracking-[0.02em] text-white">
                                        {featured.emoji && (
                                          <span className="mr-2">
                                            {featured.emoji}
                                          </span>
                                        )}
                                        {featured.name}
                                      </span>
                                    </div>
                                  </>
                                ) : null;
                              })()}
                            </div>

                            {/* Right: Quick Links + Promo */}
                            <div className="col-span-3 bg-stone-50/70 px-6 py-6">
                              <p className="font-body mb-4 text-[13px] font-medium uppercase tracking-[0.08em] text-stone-400">
                                Shop By
                              </p>
                              <div className="space-y-2.5">
                                {quickLinks.map((qLink) => (
                                  <Link
                                    key={qLink.label}
                                    href={qLink.url}
                                    className={`font-body block text-[15px] transition-colors ${qLink.highlight ? 'font-medium text-amber-600 hover:text-amber-700' : 'font-[300] text-stone-700 hover:text-black'}`}
                                    onClick={closeShopMenu}
                                  >
                                    {qLink.label}
                                  </Link>
                                ))}
                              </div>
                              <div className="h-px bg-stone-200/60 my-4" />
                              <Link
                                href="/collections"
                                className="font-body block text-[15px] font-[300] text-stone-700 transition-colors hover:text-black"
                                onClick={closeShopMenu}
                              >
                                All Collections
                              </Link>
                              <Link
                                href="/products?sort=newest"
                                className="font-body mt-2.5 block text-[15px] font-[300] text-stone-700 transition-colors hover:text-black"
                                onClick={closeShopMenu}
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
                    className={`block py-2 text-[15px] transition-colors ${isActive ? 'font-medium text-stone-900' : 'text-stone-600 hover:text-stone-900'} ${link.highlight ? 'text-[var(--sienna)] font-bold' : ''}`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="header-actions">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="icon-btn"
                aria-label="Search products"
                data-tooltip="Search"
              >
                <Search size={20} />
              </button>

              <Link
                href="/account"
                className="icon-btn"
                aria-label="My Account"
                data-tooltip="Account"
              >
                <User size={20} />
              </Link>

              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                className="icon-btn"
                aria-label={`Wishlist with ${wishlistCount} items`}
                data-tooltip="Wishlist"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="badge bg-[var(--sienna)]">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Region Selector */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowRegionMenu(!showRegionMenu)}
                  className="font-body flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium uppercase tracking-[0.08em] text-stone-600 transition-colors hover:bg-stone-100 hover:text-black focus:outline-none"
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
                    <div className="font-body border-b border-stone-100 bg-stone-50 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-500">
                      Select Region
                    </div>
                    {regions.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => {
                          setRegion(region);
                          setShowRegionMenu(false);
                        }}
                        className={`font-body group flex w-full items-center justify-between px-4 py-2.5 text-left text-[15px] hover:bg-stone-50 focus:outline-none ${
                          currentRegion?.id === region.id
                            ? 'font-medium text-blue-600'
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
                className="icon-btn"
                aria-label={`Shopping cart with ${totalItems} items`}
                data-tooltip="Cart"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span
                    className="badge bg-[var(--sienna)]"
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
