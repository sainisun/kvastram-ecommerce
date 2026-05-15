'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bed,
  BriefcaseBusiness,
  ChevronRight,
  Heart,
  Home,
  Info,
  Loader2,
  Package,
  Search,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  Wind,
  X,
  MessageCircle,
} from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { useWishlist } from '@/context/wishlist-context';
import { api } from '@/lib/api';
import type { Product } from '@/types';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  header_image_url?: string | null;
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
  regions?: Region[];
  currentRegion?: Region | null;
  onRegionChange?: (region: Region) => void;
}

type SearchResult = Pick<Product, 'id' | 'title' | 'handle' | 'thumbnail' | 'variants'>;

type MenuCategory = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  icon: typeof Bed;
  iconBg: string;
  hero: string;
  tagline: string;
  filters: string[];
  items: Array<{
    name: string;
    meta: string;
    href: string;
    image: string;
  }>;
};

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600&q=80',
];

const MENU_CATEGORIES: MenuCategory[] = [
  {
    key: 'quilts',
    title: 'Quilts & Throws',
    subtitle: 'Kantha, block print, reversible',
    href: '/collections/quilts',
    icon: Bed,
    iconBg: '#F0E0D6',
    hero: IMAGE_POOL[5],
    tagline: 'New arrivals this season',
    filters: ['All', 'Kantha', 'Block print', 'Reversible'],
    items: [
      {
        name: 'Single kantha quilt',
        meta: '12 styles - from Rs. 2,499',
        href: '/collections/single-quilts',
        image: IMAGE_POOL[5],
      },
      {
        name: 'Double reversible',
        meta: '8 styles - from Rs. 3,299',
        href: '/collections/double-quilts',
        image: IMAGE_POOL[0],
      },
      {
        name: 'King size quilt',
        meta: '6 styles - from Rs. 4,499',
        href: '/collections/king-quilts',
        image: IMAGE_POOL[3],
      },
      {
        name: 'Throw blankets',
        meta: '15 styles - from Rs. 1,799',
        href: '/collections/throws',
        image: IMAGE_POOL[2],
      },
    ],
  },
  {
    key: 'clothing',
    title: 'Clothing',
    subtitle: 'Kurtas, jackets, sarees, lehengas',
    href: '/collections/clothing',
    icon: Shirt,
    iconBg: '#EAF3DE',
    hero: IMAGE_POOL[1],
    tagline: 'Handmade layers for every day',
    filters: ['All', 'Kurtas', 'Jackets', 'Sarees'],
    items: [
      {
        name: 'Kurtas',
        meta: '20 styles - from Rs. 1,299',
        href: '/collections/kurtas',
        image: IMAGE_POOL[1],
      },
      {
        name: 'Kantha jackets',
        meta: '10 styles - from Rs. 2,299',
        href: '/collections/jackets',
        image: IMAGE_POOL[0],
      },
      {
        name: 'Sarees',
        meta: '8 styles - from Rs. 3,499',
        href: '/collections/sarees',
        image: IMAGE_POOL[3],
      },
      {
        name: 'Lehengas',
        meta: '5 styles - from Rs. 4,999',
        href: '/collections/lehengas',
        image: IMAGE_POOL[4],
      },
    ],
  },
  {
    key: 'bags',
    title: 'Bags & Totes',
    subtitle: 'Block print, kantha, jute',
    href: '/collections/bags',
    icon: BriefcaseBusiness,
    iconBg: '#E6F1FB',
    hero: IMAGE_POOL[2],
    tagline: 'Carry craft everywhere',
    filters: ['All', 'Totes', 'Clutches', 'Jute'],
    items: [
      {
        name: 'Tote bags',
        meta: '18 styles - from Rs. 699',
        href: '/collections/totes',
        image: IMAGE_POOL[2],
      },
      {
        name: 'Shoulder bags',
        meta: '12 styles - from Rs. 999',
        href: '/collections/shoulder-bags',
        image: IMAGE_POOL[4],
      },
      {
        name: 'Clutches',
        meta: '8 styles - from Rs. 599',
        href: '/collections/clutches',
        image: IMAGE_POOL[3],
      },
      {
        name: 'Backpacks',
        meta: '5 styles - from Rs. 1,499',
        href: '/collections/backpacks',
        image: IMAGE_POOL[0],
      },
    ],
  },
  {
    key: 'scarves',
    title: 'Scarves & Dupattas',
    subtitle: 'Cotton, silk blend, printed',
    href: '/collections/scarves',
    icon: Wind,
    iconBg: '#FBEAF0',
    hero: IMAGE_POOL[3],
    tagline: 'Soft prints, effortless drape',
    filters: ['All', 'Cotton', 'Silk blend', 'Printed'],
    items: [
      {
        name: 'Cotton scarves',
        meta: '16 styles - from Rs. 799',
        href: '/collections/cotton-scarves',
        image: IMAGE_POOL[3],
      },
      {
        name: 'Silk blend dupattas',
        meta: '9 styles - from Rs. 1,399',
        href: '/collections/silk-dupattas',
        image: IMAGE_POOL[1],
      },
      {
        name: 'Printed stoles',
        meta: '14 styles - from Rs. 999',
        href: '/collections/stoles',
        image: IMAGE_POOL[0],
      },
      {
        name: 'Kantha wraps',
        meta: '7 styles - from Rs. 1,799',
        href: '/collections/kantha-wraps',
        image: IMAGE_POOL[5],
      },
    ],
  },
  {
    key: 'gifts',
    title: 'Gift sets',
    subtitle: 'Curated craft bundles',
    href: '/collections/gifts',
    icon: Sparkles,
    iconBg: '#FAEEDA',
    hero: IMAGE_POOL[4],
    tagline: 'Ready-to-gift artisan picks',
    filters: ['All', 'Under 2000', 'Festive', 'Home'],
    items: [
      {
        name: 'Festive bundles',
        meta: '10 styles - from Rs. 1,499',
        href: '/collections/festive-gifts',
        image: IMAGE_POOL[4],
      },
      {
        name: 'Home gift sets',
        meta: '8 styles - from Rs. 1,999',
        href: '/collections/home-gifts',
        image: IMAGE_POOL[5],
      },
      {
        name: 'Accessory edits',
        meta: '12 styles - from Rs. 899',
        href: '/collections/accessory-gifts',
        image: IMAGE_POOL[2],
      },
      {
        name: 'Premium hampers',
        meta: '5 styles - from Rs. 3,499',
        href: '/collections/hampers',
        image: IMAGE_POOL[0],
      },
    ],
  },
];

const MOODS = [
  { label: 'Festive', href: '/collections/festive', image: IMAGE_POOL[4] },
  { label: 'Everyday', href: '/collections/everyday', image: IMAGE_POOL[1] },
  { label: 'Gifts', href: '/collections/gifts', image: IMAGE_POOL[2] },
  { label: 'Home', href: '/collections/home', image: IMAGE_POOL[5] },
];

function getSearchResultPrice(product: SearchResult) {
  const prices = product.variants?.flatMap((variant) => variant.prices || []) || [];
  const preferredPrice =
    prices.find((price) => price.currency_code?.toLowerCase() === 'inr') ||
    prices[0];

  return preferredPrice?.amount;
}

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
}: MobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { customer } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousPathnameRef = useRef(pathname);

  const enrichedCategories = useMemo(
    () =>
      MENU_CATEGORIES.map((item) => {
        const liveCategory = categories.find((category) =>
          [category.slug, category.name.toLowerCase()].some((value) =>
            value?.toLowerCase().includes(item.key)
          )
        );

        return {
          ...item,
          href: liveCategory?.slug ? `/collections/${liveCategory.slug}` : item.href,
          hero: liveCategory?.header_image_url || liveCategory?.image || item.hero,
        };
      }),
    [categories]
  );

  const handleClose = useCallback(() => {
    setActiveCategory(null);
    setSearchQuery('');
    setResults([]);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = '';
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeCategory) {
          setActiveCategory(null);
          return;
        }
        handleClose();
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeCategory, handleClose, isOpen]);

  useEffect(() => {
    if (isOpen && pathname !== previousPathnameRef.current) {
      handleClose();
    }
    previousPathnameRef.current = pathname;
  }, [handleClose, isOpen, pathname]);

  useEffect(() => {
    if (!isOpen || searchQuery.trim().length < 2) {
      setResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const { products } = await api.getProducts({
          search: searchQuery.trim(),
          limit: 5,
        });
        if (!cancelled) setResults(products || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, searchQuery]);

  const submitSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    handleClose();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const openSubmenu = (category: MenuCategory) => {
    setActiveCategory(category);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[150] bg-black/40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
          />

          <motion.div
            ref={drawerRef}
            id="mobile-navigation-menu"
            className="fixed left-0 top-0 z-[160] flex h-dvh w-full max-w-[400px] flex-col overflow-hidden bg-[#FFFDF9] text-[#1C1A17] shadow-2xl md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#E8E3DB] bg-[#FFFDF9] px-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-[#1C1A17] transition-colors hover:bg-[#F5F1EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C4613A]"
                aria-label="Close menu"
                aria-expanded={isOpen}
              >
                <X size={22} />
              </button>

              <Link
                href="/"
                onClick={handleClose}
                className="font-serif text-[21px] font-medium tracking-[0.04em]"
              >
                Kvastram
              </Link>

              <div className="flex items-center gap-1">
                <Link
                  href="/wishlist"
                  onClick={handleClose}
                  className="relative flex min-h-10 min-w-10 items-center justify-center rounded-md transition-colors hover:bg-[#F5F1EB]"
                  aria-label={`Wishlist with ${wishlistCount} items`}
                >
                  <Heart size={19} />
                  {wishlistCount > 0 && (
                    <span className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#C4613A] px-1 text-[9px] font-semibold leading-none text-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  className="relative flex min-h-10 min-w-10 items-center justify-center rounded-md transition-colors hover:bg-[#F5F1EB]"
                  aria-label={`Cart with ${cartCount} items`}
                >
                  <ShoppingBag size={19} />
                  {cartCount > 0 && (
                    <span className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#C4613A] px-1 text-[9px] font-semibold leading-none text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div
                className={`h-full overflow-y-auto bg-[#FFFDF9] transition-transform duration-300 ${
                  activeCategory ? '-translate-x-8' : 'translate-x-0'
                }`}
                aria-hidden={Boolean(activeCategory)}
              >
                <div className="border-b border-[#E8E3DB] px-4 py-3">
                  <form onSubmit={submitSearch} className="relative">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9891]"
                    />
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search quilts, jackets, bags..."
                      className="h-11 w-full rounded-lg border border-[#E8E3DB] bg-[#F5F1EB] py-2 pl-10 pr-10 text-sm text-[#1C1A17] outline-none placeholder:text-[#9C9891] focus:border-[#C4613A]"
                      autoComplete="off"
                      aria-label="Search products"
                    />
                    {searchLoading ? (
                      <Loader2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#9C9891]"
                      />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 flex min-h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#9C9891]"
                        aria-label="Clear search"
                      >
                        <X size={15} />
                      </button>
                    ) : null}
                  </form>

                  {results.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-[#E8E3DB] bg-white">
                      {results.slice(0, 5).map((product) => {
                        const price = getSearchResultPrice(product);

                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.handle || product.id}`}
                            onClick={handleClose}
                            className="flex items-center gap-3 border-b border-[#E8E3DB] p-2 last:border-b-0"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#F5F1EB]">
                              {product.thumbnail ? (
                                <OptimizedImage
                                  src={product.thumbnail}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : null}
                            </div>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-[#1C1A17]">
                                {product.title}
                              </span>
                              {price !== undefined && (
                                <span className="block text-xs text-[#5C5750]">
                                  from {formatPrice(price)}
                                </span>
                              )}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="h-8 overflow-hidden border-b border-[#C0DD97] bg-[#EAF3DE] text-xs font-medium text-[#27500A]">
                  <div className="flex h-full w-max animate-marquee items-center whitespace-nowrap">
                    {[
                      'Free shipping on orders above Rs. 2,000',
                      'Use code KANTHA10 for 10% off your first order',
                      'Handmade by artisans in Jaipur, Rajasthan',
                      'Free shipping on orders above Rs. 2,000',
                    ].map((message, index) => (
                      <span key={`${message}-${index}`} className="px-5">
                        {message}
                      </span>
                    ))}
                  </div>
                </div>

                <nav aria-label="Mobile categories">
                  {enrichedCategories.map((category) => {
                    const Icon = category.icon;

                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => openSubmenu(category)}
                        className="flex min-h-14 w-full items-center gap-3 border-b border-[#E8E3DB] px-4 text-left transition-colors hover:bg-[#FAF7F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C4613A]"
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                          style={{ backgroundColor: category.iconBg }}
                        >
                          <Icon size={18} strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium leading-tight text-[#1C1A17]">
                            {category.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#9C9891]">
                            {category.subtitle}
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-[#9C9891]" />
                      </button>
                    );
                  })}

                  <Link
                    href="/collections/sale"
                    onClick={handleClose}
                    className="flex min-h-14 items-center gap-3 border-b border-[#E8E3DB] px-4 transition-colors hover:bg-[#FAF7F2]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FCEBEB]">
                      <Tag size={18} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium leading-tight text-[#1C1A17]">
                        Sale
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#9C9891]">
                        Up to 40% off selected items
                      </span>
                    </span>
                    <span className="rounded-full bg-[#C0392B] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-white">
                      40% off
                    </span>
                  </Link>
                </nav>

                <section className="border-b border-[#E8E3DB] px-4 py-4">
                  <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5C5750]">
                    Shop by mood
                  </h2>
                  <div className="no-scrollbar flex gap-4 overflow-x-auto">
                    {MOODS.map((mood) => (
                      <Link
                        key={mood.label}
                        href={mood.href}
                        onClick={handleClose}
                        className="w-[60px] shrink-0 text-center"
                      >
                        <span className="relative mb-1 block h-12 w-12 overflow-hidden rounded-lg bg-[#F5F1EB]">
                          <OptimizedImage
                            src={mood.image}
                            alt={mood.label}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </span>
                        <span className="block text-[11px] leading-tight text-[#5C5750]">
                          {mood.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="bg-[#F5F1EB]">
                  <UtilityLink href="/track" icon={Package} label="Track my order" onClick={handleClose} />
                  <UtilityLink
                    href={buildWhatsAppHref('Hi, I need help with my Kvastram order')}
                    icon={MessageCircle}
                    label="Chat on WhatsApp"
                    onClick={handleClose}
                    external
                  />
                  <UtilityLink
                    href={customer ? '/account' : '/login'}
                    icon={User}
                    label="My account"
                    onClick={handleClose}
                  />
                  <UtilityLink href="/about" icon={Info} label="About Kvastram" onClick={handleClose} />
                </section>
              </div>

              <div
                className={`absolute inset-0 h-full overflow-y-auto bg-[#FFFDF9] transition-transform duration-300 ${
                  activeCategory ? 'translate-x-0' : 'translate-x-full'
                }`}
                aria-hidden={!activeCategory}
              >
                {activeCategory && (
                  <Submenu
                    category={activeCategory}
                    onBack={() => setActiveCategory(null)}
                    onClose={handleClose}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface UtilityLinkProps {
  href: string;
  icon: typeof Home;
  label: string;
  onClick: () => void;
  external?: boolean;
}

function UtilityLink({ href, icon: Icon, label, onClick, external = false }: UtilityLinkProps) {
  const className =
    'flex h-11 items-center gap-3 border-b border-[#E8E3DB] px-4 text-sm text-[#5C5750] last:border-b-0';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
        <Icon size={16} className="text-[#9C9891]" />
        {label}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      <Icon size={16} className="text-[#9C9891]" />
      {label}
    </Link>
  );
}

interface SubmenuProps {
  category: MenuCategory;
  onBack: () => void;
  onClose: () => void;
}

function Submenu({ category, onBack, onClose }: SubmenuProps) {
  const [activeFilter, setActiveFilter] = useState(category.filters[0]);

  return (
    <div className="min-h-full bg-[#FFFDF9]">
      <div className="grid h-[52px] grid-cols-[88px_1fr_88px] items-center border-b border-[#E8E3DB] px-3">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-10 items-center gap-1 rounded-md text-[13px] font-medium text-[#5C5750]"
          aria-label="Back to menu"
        >
          <ArrowLeft size={16} />
          Menu
        </button>
        <h2 className="truncate text-center text-base font-medium text-[#1C1A17]">
          {category.title}
        </h2>
        <span aria-hidden="true" />
      </div>

      <div className="relative h-[100px] overflow-hidden bg-[#F5F1EB]">
        <OptimizedImage
          src={category.hero}
          alt={category.title}
          fill
          className="object-cover"
          sizes="400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <p className="absolute bottom-3 left-4 text-sm font-medium text-white">
          {category.tagline}
        </p>
      </div>

      <Link
        href={category.href}
        onClick={onClose}
        className="flex min-h-11 items-center justify-between border-b border-[#E8E3DB] px-4 text-[13px] font-semibold text-[#185FA5]"
      >
        View all {category.title.toLowerCase()}
        <ArrowRight size={16} />
      </Link>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-[#E8E3DB] px-4 py-3">
        {category.filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`h-8 shrink-0 rounded-full px-3 text-xs font-medium ${
              activeFilter === filter
                ? 'bg-[#1C1A17] text-[#FFFDF9]'
                : 'border border-[#E8E3DB] text-[#5C5750]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {category.items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            className="overflow-hidden rounded-lg border border-[#E8E3DB] bg-white"
          >
            <span className="relative block aspect-square bg-[#F5F1EB]">
              <OptimizedImage
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="180px"
              />
            </span>
            <span className="block p-2">
              <span className="block text-xs font-semibold leading-snug text-[#1C1A17]">
                {item.name}
              </span>
              <span className="mt-1 block text-[10px] leading-snug text-[#9C9891]">
                {item.meta}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="border-t border-[#E8E3DB] bg-[#F5F1EB] px-3 py-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5C5750]">
          Quick picks
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Bestsellers', href: '/bestsellers' },
            { label: 'New in', href: '/products?sort=newest' },
            { label: 'On sale', href: '/collections/sale' },
          ].map((pick) => (
            <Link
              key={pick.label}
              href={pick.href}
              onClick={onClose}
              className="rounded-md border border-[#E8E3DB] bg-[#FFFDF9] px-3 py-1.5 text-xs font-medium text-[#5C5750]"
            >
              {pick.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
