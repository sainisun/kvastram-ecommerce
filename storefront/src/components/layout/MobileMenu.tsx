'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import Input from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { Button, IconButton } from '@/components/ui/Button';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { useWishlist } from '@/context/wishlist-context';
import { api } from '@/lib/api';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import type { Product } from '@/types';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  header_image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
  show_in_header?: boolean;
  product_count?: number | string | null;
  children?: Category[];
}

interface Region {
  id: string;
  name: string;
  currency_code: string;
  tax_rate: number;
}

interface Collection {
  id: string;
  title?: string;
  name?: string;
  handle: string;
  status?: string;
  show_in_megamenu?: boolean;
  cover_image_url?: string | null;
  image?: string | null;
  product_count?: number | string | null;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  collections?: Collection[];
  regions?: Region[];
  currentRegion?: Region | null;
  onRegionChange?: (region: Region) => void;
}

type SearchResult = Product;

type MenuCategory = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  icon: typeof Bed;
  iconBg: string;
  hero?: string | null;
  tagline: string;
  filters: string[];
  items: Array<{
    name: string;
    meta: string;
    href: string;
    image?: string | null;
  }>;
};

function getSearchResultPrice(product: SearchResult) {
  const prices = product.variants?.flatMap((variant) => variant.prices || []) || [];
  const preferredPrice =
    prices.find((price) => price.currency_code?.toLowerCase() === 'inr') ||
    prices[0];

  return preferredPrice?.amount;
}

function formatMenuCount(value?: number | string | null) {
  const count = typeof value === 'string' ? Number(value) : value;
  if (!count || !Number.isFinite(count)) return null;
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
}

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
  collections = [],
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousPathnameRef = useRef(pathname);

  const enrichedCategories = useMemo(
    () => {
      const icons = [Shirt, BriefcaseBusiness, Wind, Sparkles, Bed];
      const iconBgs = [
        'var(--ds-success-bg)',
        'var(--ds-info-bg)',
        'var(--ds-accent-soft)',
        'var(--ds-warning-bg)',
        'var(--ds-surface-soft)',
      ];

      return categories
        .filter((category) => category.slug && category.name)
        .slice()
        .filter(
          (category) =>
            category.is_active !== false &&
            category.show_in_header !== false &&
            !['sale', 'sales', 'sale-cat', 'markdowns'].includes(category.slug.toLowerCase())
        )
        .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
        .map((category, index) => {
          const countLabel = formatMenuCount(category.product_count);

          return {
            key: category.id,
            title: category.name,
            subtitle: countLabel || (category.children?.length ? `${category.children.length} sections` : 'Browse styles'),
            href: `/collections/${category.slug}`,
            icon: icons[index % icons.length],
            iconBg: iconBgs[index % iconBgs.length],
            hero: category.header_image_url || category.image || null,
            tagline: category.name,
            filters: [],
            items: (category.children || [])
              .filter((child) => child.slug)
              .map((child) => ({
                name: child.name,
                meta: formatMenuCount(child.product_count) || 'View category',
                href: `/collections/${child.slug}`,
                image: child.header_image_url || child.image || null,
              })),
          };
        });
    },
    [categories]
  );

  const featuredCollections = useMemo(
    () =>
      collections
        .filter(
          (collection) =>
            collection.status === 'active' &&
            collection.show_in_megamenu &&
            (collection.cover_image_url || collection.image)
        )
        .slice(0, 4)
        .map((collection) => ({
          label: collection.title || collection.name || 'Collection',
          href: `/collections/${collection.handle}`,
          image: collection.cover_image_url || collection.image || '',
        })),
    [collections]
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
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(focusTimer);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

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
        if (!cancelled) setResults(filterStorefrontReadyProducts(products || []));
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

  const handleDrawerClose = useCallback(() => {
    if (activeCategory) {
      setActiveCategory(null);
      return;
    }
    handleClose();
  }, [activeCategory, handleClose]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleDrawerClose}
      side="left"
      title="Navigation menu"
      showHeader={false}
      className="h-dvh max-w-[400px] md:hidden"
      bodyClassName="flex flex-col overflow-hidden p-0"
    >
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--ds-border-subtle)] bg-[var(--ds-surface-page)] px-3">
              <IconButton
                type="button"
                onClick={handleClose}
                variant="ghost"
                size="md"
                className="min-h-11 min-w-11 rounded-md text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-soft)]"
                aria-label="Close menu"
                aria-expanded={isOpen}
              >
                <X size={22} />
              </IconButton>

              <Link
                href="/"
                onClick={handleClose}
                className="font-display text-display-sm type-medium tracking-token-normal"
              >
                Kvastram
              </Link>

              <div className="flex items-center gap-1">
                <Link
                  href="/wishlist"
                  onClick={handleClose}
                  className="relative flex min-h-10 min-w-10 items-center justify-center rounded-md transition-colors hover:bg-[var(--ds-surface-soft)]"
                  aria-label={`Wishlist with ${wishlistCount} items`}
                >
                  <Heart size={19} />
                  {wishlistCount > 0 && (
                    <span className="kv-count-badge absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[var(--ds-accent-primary)] px-1 text-[var(--ds-text-inverse)]">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <IconButton
                  type="button"
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  className="relative min-h-10 min-w-10 rounded-md hover:bg-[var(--ds-surface-soft)]"
                  aria-label={`Cart with ${cartCount} items`}
                >
                  <ShoppingBag size={19} />
                  {cartCount > 0 && (
                    <span className="kv-count-badge absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[var(--ds-accent-primary)] px-1 text-[var(--ds-text-inverse)]">
                      {cartCount}
                    </span>
                  )}
                </IconButton>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div
                className={`h-full overflow-y-auto bg-[var(--ds-surface-page)] transition-transform duration-300 ${
                  activeCategory ? '-translate-x-8' : 'translate-x-0'
                }`}
                aria-hidden={Boolean(activeCategory)}
              >
                <div className="border-b border-[var(--ds-border-subtle)] px-4 py-3">
                  <form onSubmit={submitSearch} className="relative">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ds-text-disabled)]"
                    />
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search quilts, jackets, bags..."
                      className="bg-[var(--ds-surface-soft)] pl-10 pr-10 text-body-sm"
                      autoComplete="off"
                      aria-label="Search products"
                    />
                    {searchLoading ? (
                      <Loader2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--ds-text-disabled)]"
                      />
                    ) : searchQuery ? (
                      <IconButton
                        type="button"
                        onClick={() => setSearchQuery('')}
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 min-h-8 min-w-8 -translate-y-1/2 rounded-md text-[var(--ds-text-disabled)]"
                        aria-label="Clear search"
                      >
                        <X size={15} />
                      </IconButton>
                    ) : null}
                  </form>

                  {results.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)]">
                      {results.slice(0, 5).map((product) => {
                        const price = getSearchResultPrice(product);

                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.handle || product.id}`}
                            onClick={handleClose}
                            className="flex items-center gap-3 border-b border-[var(--ds-border-subtle)] p-2 last:border-b-0"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--ds-surface-soft)]">
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
                              <span className="block truncate text-body-xs type-medium text-[var(--ds-text-primary)]">
                                {product.title}
                              </span>
                              {price !== undefined && (
                                <span className="block text-body-xs text-[var(--ds-text-secondary)]">
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

                <div className="h-8 overflow-hidden border-b border-[var(--ds-success)] bg-[var(--ds-success-bg)] text-body-xs type-medium text-[var(--ds-success-text)]">
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
                  <Link
                    href="/products"
                    onClick={handleClose}
                    className="flex min-h-14 items-center gap-3 border-b border-[var(--ds-border-subtle)] px-4 transition-colors hover:bg-[var(--ds-surface-page)]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--ds-surface-soft)]">
                      <ShoppingBag size={18} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body-md type-medium leading-token-tight text-[var(--ds-text-primary)]">
                        Shop all products
                      </span>
                      <span className="mt-0.5 block truncate text-body-xs text-[var(--ds-text-disabled)]">
                        Browse the full Kvastram catalog
                      </span>
                    </span>
                    <ChevronRight size={17} className="text-[var(--ds-text-disabled)]" />
                  </Link>

                  {enrichedCategories.map((category) => {
                    const Icon = category.icon;

                    return (
                      <Button
                        key={category.key}
                        type="button"
                        onClick={() => openSubmenu(category)}
                        variant="ghost"
                        size="md"
                        className="flex min-h-14 w-full justify-start gap-3 border-b border-[var(--ds-border-subtle)] px-4 text-left normal-case hover:bg-[var(--ds-surface-page)]"
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                          style={{ backgroundColor: category.iconBg }}
                        >
                          <Icon size={18} strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-body-md type-medium leading-token-tight text-[var(--ds-text-primary)]">
                            {category.title}
                          </span>
                          <span className="mt-0.5 block truncate text-body-xs text-[var(--ds-text-disabled)]">
                            {category.subtitle}
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-[var(--ds-text-disabled)]" />
                      </Button>
                    );
                  })}

                  <Link
                    href="/sale"
                    onClick={handleClose}
                    className="flex min-h-14 items-center gap-3 border-b border-[var(--ds-border-subtle)] px-4 transition-colors hover:bg-[var(--ds-surface-page)]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--ds-danger-bg)]">
                      <Tag size={18} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body-md type-medium leading-token-tight text-[var(--ds-text-primary)]">
                        Sale
                      </span>
                      <span className="mt-0.5 block truncate text-body-xs text-[var(--ds-text-disabled)]">
                        Current markdowns and limited offers
                      </span>
                    </span>
                    <ChevronRight size={17} className="text-[var(--ds-text-disabled)]" />
                  </Link>
                </nav>

                {featuredCollections.length > 0 ? (
                <section className="border-b border-[var(--ds-border-subtle)] px-4 py-4">
                  <h2 className="mb-3 text-body-xs type-semibold tracking-token-wide text-[var(--ds-text-secondary)]">
                    Featured collections
                  </h2>
                  <div className="no-scrollbar flex gap-4 overflow-x-auto">
                    {featuredCollections.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={handleClose}
                        className="w-[60px] shrink-0 text-center"
                      >
                        <span className="relative mb-1 block h-12 w-12 overflow-hidden rounded-lg bg-[var(--ds-surface-soft)]">
                          <OptimizedImage
                            src={item.image}
                            alt={item.label}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </span>
                        <span className="block text-body-xs leading-token-tight text-[var(--ds-text-secondary)]">
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
                ) : null}

                <section className="bg-[var(--ds-surface-soft)]">
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
                className={`absolute inset-0 h-full overflow-y-auto bg-[var(--ds-surface-page)] transition-transform duration-300 ${
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
    </Drawer>
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
    'flex h-11 items-center gap-3 border-b border-[var(--ds-border-subtle)] px-4 text-body-sm text-[var(--ds-text-secondary)] last:border-b-0';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
        <Icon size={16} className="text-[var(--ds-text-disabled)]" />
        {label}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      <Icon size={16} className="text-[var(--ds-text-disabled)]" />
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
  return (
    <div className="min-h-full bg-[var(--ds-surface-page)]">
      <div className="grid h-[52px] grid-cols-[88px_1fr_88px] items-center border-b border-[var(--ds-border-subtle)] px-3">
        <Button
          type="button"
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="flex min-h-10 justify-start gap-1 rounded-md px-0 text-body-xs type-medium normal-case text-[var(--ds-text-secondary)]"
          aria-label="Back to menu"
        >
          <ArrowLeft size={16} />
          Menu
        </Button>
        <h2 className="truncate text-center text-body-md type-medium text-[var(--ds-text-primary)]">
          {category.title}
        </h2>
        <span aria-hidden="true" />
      </div>

      {category.hero ? (
        <div className="relative h-[100px] overflow-hidden bg-[var(--ds-surface-soft)]">
          <OptimizedImage
            src={category.hero}
            alt={category.title}
            fill
            className="object-cover"
            sizes="400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.55)] to-transparent" />
          <p className="absolute bottom-3 left-4 text-body-sm type-medium text-[var(--ds-text-inverse)]">
            {category.tagline}
          </p>
        </div>
      ) : null}

      <Link
        href={category.href}
        onClick={onClose}
        className="flex min-h-11 items-center justify-between border-b border-[var(--ds-border-subtle)] px-4 text-body-xs type-semibold text-[var(--ds-info)]"
      >
        View all {category.title.toLowerCase()}
        <ArrowRight size={16} />
      </Link>

      {category.items.length > 0 ? (
      <div className="grid grid-cols-2 gap-2 p-3">
        {category.items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            className="overflow-hidden rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)]"
          >
            {item.image ? (
              <span className="relative block aspect-square bg-[var(--ds-surface-soft)]">
                <OptimizedImage
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="180px"
                />
              </span>
            ) : null}
            <span className="block p-2">
              <span className="block text-body-xs type-semibold leading-token-snug text-[var(--ds-text-primary)]">
                {item.name}
              </span>
              <span className="mt-1 block text-body-xs leading-token-snug text-[var(--ds-text-disabled)]">
                {item.meta}
              </span>
            </span>
          </Link>
        ))}
      </div>
      ) : null}

      <div className="border-t border-[var(--ds-border-subtle)] bg-[var(--ds-surface-soft)] px-3 py-3">
        <h3 className="mb-2 text-body-xs type-semibold tracking-token-wide text-[var(--ds-text-secondary)]">
          Quick picks
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Bestsellers', href: '/bestsellers' },
            { label: 'New in', href: '/products?sort=newest' },
            { label: 'On sale', href: '/sale' },
          ].map((pick) => (
            <Link
              key={pick.label}
              href={pick.href}
              onClick={onClose}
              className="rounded-md border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-page)] px-3 py-1.5 text-body-xs type-medium text-[var(--ds-text-secondary)]"
            >
              {pick.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
