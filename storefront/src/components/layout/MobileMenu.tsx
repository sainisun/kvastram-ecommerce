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
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useShop } from '@/context/shop-context';
import { useWishlist } from '@/context/wishlist-context';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
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

  useEffect(() => {
    if (isOpen) {
      if (isFirstOpen.current) {
        isFirstOpen.current = false;
        return;
      }
      if (pathname) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleClose();
      }
    } else {
      isFirstOpen.current = true;
    }
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
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
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
          <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="text-lg font-bold tracking-tight text-black font-serif"
              >
                KVASTRAM
              </Link>
              <button
                ref={closeButtonRef}
                onClick={handleClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-black transition-colors rounded-full hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search Bar - Bagisto Style */}
            <div className="px-4 pb-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm text-black placeholder:text-gray-400 transition-colors"
                />
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
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
              <h3 className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Categories
              </h3>

              {categories.length > 0 ? (
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?category_id=${category.id}`}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-3.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-black transition-colors min-h-[44px]"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-4 text-sm text-gray-400">
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
                  href="/products?tag=bestseller"
                  icon={<Tag size={18} />}
                  label="Bestsellers"
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

            <div className="h-px bg-gray-100 mx-4" />

            {/* Quick Links */}
            <div className="py-2">
              <h3 className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
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
          <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
            {/* User Account - Bagisto Style (at bottom) */}
            {!authLoading && (
              <div className="space-y-2">
                <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Account
                </h3>
                {customer ? (
                  <div className="space-y-1">
                    <p className="px-1 py-2 text-sm text-gray-600">
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
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors rounded-lg min-h-[44px]"
                    >
                      <LogOut size={18} className="text-gray-400" />
                      <span className="text-[15px]">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      onClick={handleLinkClick}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors min-h-[44px]"
                    >
                      <User size={18} />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={handleLinkClick}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-medium rounded-full border border-gray-300 hover:bg-gray-50 transition-colors min-h-[44px]"
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
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg min-h-[44px]"
              >
                <span className="flex items-center gap-3 text-gray-700">
                  <Globe size={18} className="text-gray-400" />
                  {currentRegion
                    ? `${currentRegion.name} (${currentRegion.currency_code})`
                    : 'Select Region'}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 transition-transform ${
                    showRegionMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showRegionMenu && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => {
                        onRegionChange(region);
                        setShowRegionMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors min-h-[44px] ${
                        currentRegion?.id === region.id
                          ? 'bg-gray-50 text-black font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <span>{region.name}</span>
                      <span className="text-xs font-mono text-gray-400 uppercase">
                        {region.currency_code}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-full transition-colors"
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
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
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
      className={`flex items-center gap-3 px-4 py-3 text-[15px] transition-colors rounded-lg min-h-[44px] ${
        isActive
          ? 'text-black font-semibold bg-gray-50'
          : highlight
            ? 'text-amber-600 font-medium hover:bg-amber-50'
            : 'text-gray-700 hover:bg-gray-50 hover:text-black'
      }`}
    >
      <span className={isActive ? 'text-black' : 'text-gray-400'}>{icon}</span>
      {label}
    </Link>
  );
}
