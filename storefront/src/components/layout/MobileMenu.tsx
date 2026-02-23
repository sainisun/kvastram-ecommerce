'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  User,
  ShoppingBag,
  Heart,
  Globe,
  Home,
  Tag,
  Layers,
  Phone,
  Info,
} from 'lucide-react';

/**
 * MobileMenu Component
 *
 * An Amazon-style, slide-in mobile menu with drill-down navigation.
 *
 * Level 1 (Main Menu): Shows greeting, main nav links, and expandable sections
 * Level 2 (Sub-Menu):  Shows category list with a "back" button at the top
 */

interface Category {
  id: string;
  name: string;
  slug: string;
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

type MenuLevel = 'main' | 'categories' | 'account' | 'regions';

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
  regions,
  currentRegion,
  onRegionChange,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [menuLevel, setMenuLevel] = useState<MenuLevel>('main');

  const handleClose = () => {
    onClose();
    // Reset to main level after animation completes
    setTimeout(() => setMenuLevel('main'), 300);
  };

  const handleLinkClick = () => {
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 md:hidden"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 h-full w-[85vw] max-w-[360px] bg-white z-50 md:hidden shadow-2xl flex flex-col"
          >
            {/* ─── Header (Amazon-style dark bar) ─── */}
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
                <div>
                  <span className="text-base font-bold tracking-tight">
                    Hello, Welcome
                  </span>
                  <p className="text-[11px] text-stone-400 tracking-wide">
                    Browse Kvastram
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-white/70 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* ─── Scrollable Body ─── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <AnimatePresence mode="popLayout" initial={false}>
                {/* ═════════════ LEVEL 1: Main Menu ═════════════ */}
                {menuLevel === 'main' && (
                  <motion.div
                    key="main"
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '-100%', opacity: 0 }}
                    transition={{ type: 'tween', duration: 0.2 }}
                    className="absolute inset-0 overflow-y-auto"
                  >
                    {/* ── Trending Section ── */}
                    <div className="py-3">
                      <h3 className="px-5 py-2 text-sm font-bold text-stone-900">
                        Trending
                      </h3>
                      <NavLink
                        href="/products?sort=newest"
                        icon={<Tag size={18} />}
                        label="New Arrivals"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                      <NavLink
                        href="/products?tag=bestseller"
                        icon={<Tag size={18} />}
                        label="Bestsellers"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                      <NavLink
                        href="/sale"
                        icon={<Tag size={18} />}
                        label="Sale"
                        pathname={pathname}
                        onClick={handleLinkClick}
                        highlight
                      />
                    </div>

                    <div className="h-px bg-stone-100 mx-5" />

                    {/* ── Shop by Category (Drill-down) ── */}
                    <div className="py-3">
                      <h3 className="px-5 py-2 text-sm font-bold text-stone-900">
                        Shop by Category
                      </h3>
                      <button
                        onClick={() => setMenuLevel('categories')}
                        className="w-full flex items-center justify-between px-5 py-3 text-[15px] text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <Layers size={18} className="text-stone-400" />
                          All Categories
                        </span>
                        <ChevronRight size={18} className="text-stone-400" />
                      </button>
                      <NavLink
                        href="/collections"
                        icon={<Layers size={18} />}
                        label="Collections"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                      <NavLink
                        href="/products"
                        icon={<ShoppingBag size={18} />}
                        label="Shop All"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                    </div>

                    <div className="h-px bg-stone-100 mx-5" />

                    {/* ── Pages ── */}
                    <div className="py-3">
                      <h3 className="px-5 py-2 text-sm font-bold text-stone-900">
                        Explore
                      </h3>
                      <NavLink
                        href="/"
                        icon={<Home size={18} />}
                        label="Home"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                      <NavLink
                        href="/about"
                        icon={<Info size={18} />}
                        label="About Us"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                      <NavLink
                        href="/contact"
                        icon={<Phone size={18} />}
                        label="Contact"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                    </div>

                    <div className="h-px bg-stone-100 mx-5" />

                    {/* ── Account & Settings ── */}
                    <div className="py-3">
                      <h3 className="px-5 py-2 text-sm font-bold text-stone-900">
                        Account &amp; Settings
                      </h3>
                      <NavLink
                        href="/account"
                        icon={<User size={18} />}
                        label="My Account"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                      <NavLink
                        href="/account/orders"
                        icon={<ShoppingBag size={18} />}
                        label="Orders"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />
                      <NavLink
                        href="/wishlist"
                        icon={<Heart size={18} />}
                        label="Wishlist"
                        pathname={pathname}
                        onClick={handleLinkClick}
                      />

                      <button
                        onClick={() => setMenuLevel('regions')}
                        className="w-full flex items-center justify-between px-5 py-3 text-[15px] text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <Globe size={18} className="text-stone-400" />
                          {currentRegion
                            ? `${currentRegion.name} (${currentRegion.currency_code})`
                            : 'Select Region'}
                        </span>
                        <ChevronRight size={18} className="text-stone-400" />
                      </button>
                    </div>

                    {/* Bottom padding for scroll */}
                    <div className="h-8" />
                  </motion.div>
                )}

                {/* ═════════════ LEVEL 2: Categories ═════════════ */}
                {menuLevel === 'categories' && (
                  <motion.div
                    key="categories"
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'tween', duration: 0.2 }}
                    className="absolute inset-0 overflow-y-auto"
                  >
                    {/* Back Button Header */}
                    <button
                      onClick={() => setMenuLevel('main')}
                      className="w-full flex items-center gap-3 px-5 py-4 bg-stone-50 border-b border-stone-100 text-sm font-bold text-stone-900 hover:bg-stone-100 active:bg-stone-200 transition-colors"
                    >
                      <ChevronLeft size={18} />
                      Main Menu
                    </button>

                    <h3 className="px-5 py-3 text-sm font-bold text-stone-900 border-b border-stone-50">
                      Shop by Category
                    </h3>

                    <div className="py-1">
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/products?category_id=${cat.id}`}
                            className="flex items-center justify-between px-5 py-3.5 text-[15px] text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                            onClick={handleLinkClick}
                          >
                            <span>{cat.name}</span>
                            <ChevronRight
                              size={16}
                              className="text-stone-300"
                            />
                          </Link>
                        ))
                      ) : (
                        <p className="px-5 py-4 text-sm text-stone-400">
                          No categories found.
                        </p>
                      )}
                    </div>

                    <div className="h-px bg-stone-100 mx-5 my-1" />

                    <Link
                      href="/products"
                      className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-stone-900 hover:bg-stone-50 transition-colors"
                      onClick={handleLinkClick}
                    >
                      View All Products
                    </Link>

                    <div className="h-8" />
                  </motion.div>
                )}

                {/* ═════════════ LEVEL 2: Regions ═════════════ */}
                {menuLevel === 'regions' && (
                  <motion.div
                    key="regions"
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'tween', duration: 0.2 }}
                    className="absolute inset-0 overflow-y-auto"
                  >
                    {/* Back Button Header */}
                    <button
                      onClick={() => setMenuLevel('main')}
                      className="w-full flex items-center gap-3 px-5 py-4 bg-stone-50 border-b border-stone-100 text-sm font-bold text-stone-900 hover:bg-stone-100 active:bg-stone-200 transition-colors"
                    >
                      <ChevronLeft size={18} />
                      Main Menu
                    </button>

                    <h3 className="px-5 py-3 text-sm font-bold text-stone-900 border-b border-stone-50">
                      Select Region
                    </h3>

                    <div className="py-1">
                      {regions.map((region) => (
                        <button
                          key={region.id}
                          onClick={() => {
                            onRegionChange(region);
                            handleClose();
                          }}
                          className={`w-full flex items-center justify-between px-5 py-3.5 text-[15px] hover:bg-stone-50 active:bg-stone-100 transition-colors ${
                            currentRegion?.id === region.id
                              ? 'text-stone-900 font-medium bg-stone-50'
                              : 'text-stone-700'
                          }`}
                        >
                          <span>{region.name}</span>
                          <span className="text-xs font-mono text-stone-400 uppercase">
                            {region.currency_code}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="h-8" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Helper: NavLink ─── */
function NavLink({
  href,
  icon,
  label,
  pathname,
  onClick,
  highlight = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  const isActive =
    pathname === href ||
    (href !== '/' && pathname?.startsWith(href.split('?')[0]));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-5 py-3 text-[15px] transition-colors ${
        isActive
          ? 'text-stone-900 font-semibold bg-stone-50'
          : highlight
            ? 'text-amber-600 font-medium hover:bg-amber-50 active:bg-amber-100'
            : 'text-stone-700 hover:bg-stone-50 active:bg-stone-100'
      }`}
      onClick={onClick}
    >
      <span className={isActive ? 'text-stone-900' : 'text-stone-400'}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
