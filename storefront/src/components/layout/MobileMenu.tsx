'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Search,
  User,
  Heart,
  ShoppingBag,
  LogOut,
  ChevronDown,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  HelpCircle,
  Home,
  Tag,
  Layers,
  Phone,
  Info,
  Package,
  Clapperboard,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useShop } from '@/context/shop-context';
import { useWishlist } from '@/context/wishlist-context';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  children?: Category[];
}

interface Region {
  id: string;
  name: string;
  currency_code: string;
  tax_rate: number;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  regions: Region[];
  currentRegion: Region | null;
  onRegionChange: (region: Region) => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
  regions,
  currentRegion,
  onRegionChange,
}: MobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, loading: authLoading, logout } = useAuth();
  const { totalItems: wishlistCount } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    onClose();
    setShowRegionMenu(false);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const isFirstOpen = useRef(true);

  const prevPathname = useRef(pathname);

  useEffect(() => {
    let closeTimeout: ReturnType<typeof setTimeout> | null = null;

    if (isOpen && pathname !== prevPathname.current) {
      closeTimeout = setTimeout(() => {
        handleClose();
      }, 0);
    }
    prevPathname.current = pathname;

    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [pathname, isOpen, handleClose]);

  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const handleLinkClick = () => {
    handleClose();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleClose();
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const socialLinks = [
    {
      icon: Instagram,
      href: 'https://instagram.com/kvastram',
      label: 'Instagram',
    },
    {
      icon: Facebook,
      href: 'https://facebook.com/kvastram',
      label: 'Facebook',
    },
    { icon: Twitter, href: 'https://twitter.com/kvastram', label: 'Twitter' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Drawer - Full screen overlay */}
        <motion.div
          ref={menuRef}
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{
            type: 'tween',
            duration: 0.3,
            ease: 'easeOut',
          }}
          className="fixed top-0 left-0 h-full w-full max-w-[400px] bg-white z-50 md:hidden shadow-2xl flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          {/* Header - Fixed */}
          <div className="sticky top-0 bg-white z-10 border-b border-[var(--line)]">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="logo"
              >
                Kvast<span className="color-sienna">ram</span>
              </Link>
              <button
                ref={closeButtonRef}
                onClick={handleClose}
                className="icon-btn"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="font-body w-full rounded-[var(--radius-sm)] border border-brand-line bg-brand-cream py-3 pl-10 pr-10 text-body-md type-light text-brand-ink transition-colors placeholder:text-brand-muted focus:border-brand-sienna focus:outline-none"
                />
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Navigation - Categories Flat List */}
            <div className="py-2">
              <h3 className="font-body px-4 py-3 text-body-xs type-medium uppercase tracking-token-wide text-brand-muted">
                Categories
              </h3>

              {categories.length > 0 ? (
                <div className="space-y-1">
                  {categories.map((category) => (
                    <div key={category.id}>
                      <div className="flex items-center justify-between hover:bg-brand-cream transition-colors">
                        <Link
                          href={`/collections/${category.slug}`}
                          onClick={handleLinkClick}
                          className="font-body flex min-h-[44px] flex-1 items-center gap-3 px-4 py-3.5 text-body-md type-light text-brand-muted hover:text-brand-ink"
                        >
                          {category.name}
                        </Link>
                        {category.children && category.children.length > 0 && (
                          <button
                            onClick={(e) => {
                              const target = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              const icon = e.currentTarget
                                .firstElementChild as HTMLElement;
                              if (target.style.maxHeight) {
                                target.style.maxHeight = '';
                                icon.style.transform = '';
                              } else {
                                target.style.maxHeight =
                                  target.scrollHeight + 'px';
                                icon.style.transform = 'rotate(180deg)';
                              }
                            }}
                            className="p-3 text-brand-muted hover:text-brand-ink transition-colors"
                            aria-label={`Toggle ${category.name} subcategories`}
                          >
                            <ChevronDown
                              size={18}
                              className="transition-transform duration-300"
                            />
                          </button>
                        )}
                      </div>
                      {category.children && category.children.length > 0 && (
                        <div
                          className="overflow-hidden transition-all duration-300 ease-out max-h-0 bg-brand-cream/50"
                          style={{ maxHeight: '' }}
                        >
                          <div className="pl-8 py-1 pb-2 space-y-1">
                            {category.children.map((child) => (
                              <Link
                                key={child.id}
                                href={`/collections/${child.slug}`}
                                onClick={handleLinkClick}
                                className="font-body block py-2.5 text-body-md type-light text-brand-muted transition-colors hover:text-brand-ink"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-4 text-body-sm text-brand-muted">
                  No categories available
                </p>
              )}

              <div className="mt-2 space-y-1">
                <MobileNavLink
                  href="/products"
                  icon={<ShoppingBag size={18} />}
                  label="Shop All"
                  pathname={pathname}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/products?sort=newest"
                  icon={<Tag size={18} />}
                  label="New Arrivals"
                  pathname={pathname}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/products?tag_id=plus-size"
                  icon={<Tag size={18} />}
                  label="Plus Size"
                  pathname={pathname}
                  onClick={handleLinkClick}
                  highlight
                />
                <MobileNavLink
                  href="/bestsellers"
                  icon={<Tag size={18} />}
                  label="Bestsellers"
                  pathname={pathname}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/reels"
                  icon={<Clapperboard size={18} />}
                  label="Reels"
                  pathname={pathname}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/sale"
                  icon={<Tag size={18} />}
                  label="Sale"
                  pathname={pathname}
                  onClick={handleLinkClick}
                  highlight
                />
              </div>
            </div>

            <div className="h-px bg-brand-soft mx-4" />

            {/* Quick Links */}
            <div className="py-2">
              <h3 className="font-body px-4 py-3 text-body-xs type-medium uppercase tracking-token-wide text-brand-muted">
                Explore
              </h3>
              <div className="space-y-1">
                <MobileNavLink
                  href="/"
                  icon={<Home size={18} />}
                  label="Home"
                  pathname={pathname}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/collections"
                  icon={<Layers size={18} />}
                  label="Collections"
                  pathname={pathname}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/about"
                  icon={<Info size={18} />}
                  label="About Us"
                  pathname={pathname}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/contact"
                  icon={<Phone size={18} />}
                  label="Contact Us"
                  pathname={pathname}
                  onClick={handleLinkClick}
                />
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-brand-line bg-brand-cream p-4 space-y-4">
            {/* User Account */}
            {!authLoading && (
              <div className="space-y-2">
                <h3 className="font-body px-1 text-body-xs type-medium uppercase tracking-token-wide text-brand-muted">
                  Account
                </h3>
                {customer ? (
                  <div className="space-y-1">
                    <p className="font-body px-1 py-2 text-body-md type-light text-brand-muted">
                      Welcome, {customer.first_name || 'Customer'}
                    </p>
                    <MobileNavLink
                      href="/account"
                      icon={<User size={18} />}
                      label="My Account"
                      pathname={pathname}
                      onClick={handleLinkClick}
                    />
                    <MobileNavLink
                      href="/account/orders"
                      icon={<Package size={18} />}
                      label="My Orders"
                      pathname={pathname}
                      onClick={handleLinkClick}
                    />
                    <MobileNavLink
                      href="/wishlist"
                      icon={<Heart size={18} />}
                      label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
                      pathname={pathname}
                      onClick={handleLinkClick}
                    />
                    <button
                      onClick={() => {
                        logout();
                        handleClose();
                      }}
                      className="font-body flex min-h-[44px] w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-body-md type-light text-brand-muted transition-colors hover:bg-brand-soft hover:text-brand-ink"
                    >
                      <LogOut size={18} className="text-brand-muted" />
                      <span className="text-body-md">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      onClick={handleLinkClick}
                      className="font-body flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-brand-ink px-4 py-3 text-body-xs type-medium uppercase tracking-token-wider text-white transition-colors hover:bg-brand-dark"
                    >
                      <User size={18} />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={handleLinkClick}
                      className="font-body flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-brand-line bg-white px-4 py-3 text-body-xs type-medium uppercase tracking-token-wider text-brand-ink transition-colors hover:bg-brand-cream"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Region Selector */}
            <div>
              <button
                onClick={() => setShowRegionMenu(!showRegionMenu)}
                className="font-body flex min-h-[44px] w-full items-center justify-between rounded-[var(--radius-md)] border border-brand-line bg-white px-4 py-3 text-body-sm type-medium uppercase tracking-token-wide"
              >
                <span className="flex items-center gap-3 text-brand-muted">
                  <Globe size={18} className="text-brand-muted" />
                  {currentRegion
                    ? `${currentRegion.name} (${currentRegion.currency_code})`
                    : 'Select Region'}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-brand-muted transition-transform ${
                    showRegionMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showRegionMenu && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 bg-white border border-brand-line rounded-[var(--radius-md)] overflow-hidden"
                >
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => {
                        onRegionChange(region);
                        setShowRegionMenu(false);
                      }}
                        className={`font-body flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left text-body-md hover:bg-brand-cream transition-colors ${
                          currentRegion?.id === region.id
                            ? 'bg-brand-cream type-medium text-brand-ink'
                            : 'text-brand-muted'
                        }`}
                    >
                      <span>{region.name}</span>
                      <span className="text-body-xs font-mono text-brand-muted uppercase">
                        {region.currency_code}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Social Links — rounded-full kept: circular icon buttons */}
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-brand-muted hover:text-brand-ink hover:bg-white rounded-full transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>

            {/* Support Link */}
            <Link
              href="/contact"
              onClick={handleLinkClick}
              className="font-body flex items-center justify-center gap-2 text-body-md type-light text-brand-muted transition-colors hover:text-brand-ink"
            >
              <HelpCircle size={16} />
              Need Help?
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

interface MobileNavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
  onClick: () => void;
  highlight?: boolean;
}

function MobileNavLink({
  href,
  icon,
  label,
  pathname,
  onClick,
  highlight = false,
}: MobileNavLinkProps) {
  const isActive =
    pathname === href ||
    (href !== '/' && pathname?.startsWith(href.split('?')[0]));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`font-body flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-body-md transition-colors ${
        isActive
          ? 'text-brand-ink type-semibold bg-brand-cream'
          : highlight
            ? 'text-amber-600 type-medium hover:bg-amber-50'
            : 'text-brand-muted hover:bg-brand-cream hover:text-brand-ink'
      }`}
    >
      <span className={isActive ? 'text-brand-ink' : 'text-brand-muted'}>{icon}</span>
      {label}
    </Link>
  );
}

