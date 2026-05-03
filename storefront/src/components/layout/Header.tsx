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
  { label: 'Reels', url: '/reels', order: 6 },
  { label: 'Sale', url: '/sale', order: 7, highlight: true },
  { label: 'About', url: '/about', order: 8 },
  { label: 'Contact', url: '/contact', order: 9 },
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
          <div className="announcement-bar announce relative flex h-[34px] items-center justify-center overflow-hidden bg-[var(--sienna)] px-9">
            <div className="animate-marquee whitespace-nowrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={`ticker-${i}`} className="px-8 whitespace-nowrap">
                  <span>{announcementText}</span>
                </span>
              ))}
            </div>
            <button
              onClick={handleDismissAnnouncement}
              className="announcement-dismiss absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-1"
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
              className="nav-logo logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              Kvast<span>ram</span>
            </Link>

            {/* Right: Search & Cart */}
            <div className="header-actions">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="icon-btn"
                aria-label="Search"
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
            <Link href="/" className="nav-logo logo shrink-0">
              Kvast<span>ram</span>
            </Link>

            {/* Nav - Desktop */}
            <nav className="flex min-w-0 flex-1 items-center justify-center gap-3 xl:gap-6 2xl:gap-8">
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
                        className={`nav-link flex items-center gap-1 rounded py-2 transition-colors focus:outline-none ${isActive ? 'nav-link-active' : ''}`}
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
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[var(--paper)] shadow-2xl border border-[var(--soft)] rounded-[var(--radius-sm)] overflow-hidden mega-menu-enter">
                          <div className="grid min-h-[340px] grid-cols-12">
                            {/* Left: Categories with Subcategories */}
                            <div className="col-span-5 border-r border-[var(--soft)] px-6 py-6">
                              <p className="mega-menu-heading mb-4">
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
                                      className="nav-link -ml-2 block border-l-2 border-transparent py-1.5 pl-2 transition-colors hover:border-[var(--sienna)]"
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
                                                  className="nav-dropdown-item block py-0.5 pl-2 transition-colors"
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
                              <div className="h-px bg-[var(--soft)] my-3" />
                              <Link
                                href="/products"
                                className="nav-icon-label hover-text-accent flex items-center gap-1.5 transition-colors"
                                onClick={closeShopMenu}
                              >
                                Shop All Products →
                              </Link>
                            </div>

                            {/* Center: Featured Image (changes on category hover) */}
                            <div className="col-span-4 relative overflow-hidden bg-[var(--soft)]">
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
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--soft)] to-[var(--line)]">
                                          <span className="mega-menu-featured-title">
                                            {featured.emoji ||
                                              featured.name?.charAt(0)}
                                          </span>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                      <span className="mega-menu-featured-label mb-1 block">
                                        Featured
                                      </span>
                                      <span className="mega-menu-featured-title">
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
                            <div className="col-span-3 bg-[var(--cream)] px-6 py-6">
                              <p className="mega-menu-heading mb-4">
                                Shop By
                              </p>
                              <div className="space-y-2.5">
                                {quickLinks.map((qLink) => (
                                  <Link
                                    key={qLink.label}
                                    href={qLink.url}
                                    className={`nav-dropdown-item block transition-colors ${qLink.highlight ? 'nav-link-highlight' : ''}`}
                                    onClick={closeShopMenu}
                                  >
                                    {qLink.label}
                                  </Link>
                                ))}
                              </div>
                              <div className="h-px bg-[var(--line)] my-4" />
                              <Link
                                href="/collections"
                                className="nav-dropdown-item nav-dropdown-item-active hover-text-accent block transition-colors"
                                onClick={closeShopMenu}
                              >
                                All Collections
                              </Link>
                              <Link
                                href="/products?sort=newest"
                                className="nav-dropdown-item nav-dropdown-item-active hover-text-accent mt-2.5 block transition-colors"
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
                    className={`nav-link block py-2 transition-colors ${isActive ? 'nav-link-active' : ''} ${link.highlight ? 'nav-link-highlight' : ''}`}
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
                  className="nav-icon-label hover-text-primary flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--soft)] focus:outline-none"
                  aria-label="Select region and currency"
                  aria-expanded={showRegionMenu}
                  aria-haspopup="true"
                  title="Select Region"
                >
                  <Globe size={20} />
                  <span>
                    {currentRegion?.currency_code || 'USD'}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {showRegionMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--paper)] rounded-[var(--radius-md)] shadow-xl border border-[var(--soft)] py-1 overflow-hidden">
                    <div className="mega-menu-heading border-b border-[var(--soft)] bg-[var(--cream)] px-4 py-2">
                      Select Region
                    </div>
                    {regions.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => {
                          setRegion(region);
                          setShowRegionMenu(false);
                        }}
                        className={`nav-dropdown-item group flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--cream)] focus:outline-none ${
                          currentRegion?.id === region.id
                            ? 'nav-link-highlight'
                            : ''
                        }`}
                      >
                        <span>{region.name}</span>
                        <span className="nav-icon-label hover-text-primary">
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
