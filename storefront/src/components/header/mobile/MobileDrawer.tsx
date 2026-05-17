'use client';

import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { DrawerNavItem } from './DrawerNavItem';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';
import { IconButton } from '@/components/ui/Button';

interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  handle?: string;
  is_active?: boolean;
  show_in_header?: boolean;
  display_order?: number;
  children?: HeaderCategory[];
}

interface Collection {
  id: string;
  title?: string;
  name?: string;
  handle: string;
  status?: string;
  show_in_megamenu?: boolean;
  display_order?: number;
}

const SHOP_SECTIONS = [
  {
    label: 'Clothing',
    items: [
      { label: 'Jackets', href: '/categories/jackets' },
      { label: 'Sarees', href: '/categories/sarees' },
      { label: 'Suits & Kurtas', href: '/categories/suits-kurtas' },
      { label: 'Lehengas', href: '/categories/lehengas' },
      { label: 'T-Shirts & Tops', href: '/categories/t-shirts' },
    ],
  },
  {
    label: 'Bags & Home',
    items: [
      { label: 'Tote Bags', href: '/categories/tote-bags' },
      { label: 'Home Textiles', href: '/categories/home-textiles' },
    ],
  },
];

const COLLECTIONS_SECTIONS = [
  {
    label: 'Collections',
    items: [
      { label: 'Kantha Essentials', href: '/collections/kantha-essentials' },
      { label: 'Festival Ready', href: '/collections/festival-ready' },
      { label: 'Gifts Under Rs. 2,000', href: '/collections/gifts-under-2000' },
    ],
  },
];

const FALLBACK_NAV_ITEMS = [
  {
    label: 'Shop',
    href: '/products',
    subSections: SHOP_SECTIONS,
    viewAllLabel: 'Shop all products',
    viewAllHref: '/products',
  },
  {
    label: 'Collections',
    href: '/collections',
    subSections: COLLECTIONS_SECTIONS,
    viewAllLabel: 'All collections',
    viewAllHref: '/collections',
  },
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'About', href: '/about' },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  expandedItem: string | null;
  onToggleItem: (label: string) => void;
  categories: HeaderCategory[];
  collections: Collection[];
}

function sortByDisplayOrder<T extends { display_order?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
}

function categoryHref(category: HeaderCategory) {
  return `/categories/${category.slug || category.handle}`;
}

function collectionTitle(collection: Collection) {
  return collection.title || collection.name || 'Collection';
}

export function MobileDrawer({
  isOpen,
  onClose,
  expandedItem,
  onToggleItem,
  categories,
  collections,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const headerCategories = sortByDisplayOrder(
    categories.filter((category) => category.is_active !== false && category.show_in_header !== false)
  );
  const activeMenuCollections = sortByDisplayOrder(
    collections.filter((collection) => collection.status === 'active' && collection.show_in_megamenu)
  );
  const navItems = headerCategories.length
    ? [
        {
          label: 'Shop',
          href: '/products',
          subSections: [
            {
              label: 'Categories',
              items: headerCategories.slice(0, 10).map((category) => ({
                label: category.name,
                href: categoryHref(category),
              })),
            },
          ],
          viewAllLabel: 'Shop all products',
          viewAllHref: '/products',
        },
        {
          label: 'Collections',
          href: '/collections',
          subSections: activeMenuCollections.length
            ? [
                {
                  label: 'Collections',
                  items: activeMenuCollections.slice(0, 8).map((collection) => ({
                    label: collectionTitle(collection),
                    href: `/collections/${collection.handle}`,
                  })),
                },
              ]
            : COLLECTIONS_SECTIONS,
          viewAllLabel: 'All collections',
          viewAllHref: '/collections',
        },
        { label: 'New Arrivals', href: '/products?sort=newest' },
        { label: 'About', href: '/about' },
      ]
    : FALLBACK_NAV_ITEMS;

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[rgba(26,23,20,0.5)] md:hidden"
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 w-full bg-[var(--ds-surface-paper)] flex flex-col md:hidden"
            aria-modal="true"
            role="dialog"
            aria-label="Navigation"
          >
            <div className="h-[54px] shrink-0 border-b border-[var(--ds-border-strong)] flex items-center justify-end px-4">
              <IconButton
                type="button"
                onClick={onClose}
                variant="ghost"
                size="md"
                className="h-10 w-10 text-[var(--ds-accent-primary)]"
                aria-label="Close navigation"
              >
                <X size={20} strokeWidth={1.8} />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto">
              {navItems.map((item) => (
                <DrawerNavItem
                  key={item.label}
                  label={item.label}
                  href={item.href}
                  isActive={pathname.startsWith(item.href) && item.href !== '/'}
                  isExpanded={expandedItem === item.label}
                  subSections={item.subSections}
                  viewAllLabel={item.viewAllLabel}
                  viewAllHref={item.viewAllHref}
                  onToggle={() => onToggleItem(item.label)}
                  onClose={onClose}
                />
              ))}
            </div>

            <div className="shrink-0 border-t border-[var(--ds-border-strong)] p-3 flex gap-2 bg-[var(--ds-surface-paper)]">
              <a
                href="/track"
                className="flex-1 py-2.5 rounded-md font-body text-[11px] font-medium uppercase tracking-[0.06em] border border-[var(--ds-border-strong)] text-[var(--ds-text-secondary)] text-center"
              >
                Track order
              </a>
              <a
                href={buildWhatsAppHref('Hi, I need help')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-md font-body text-[11px] font-medium uppercase tracking-[0.06em] bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)] text-center"
              >
                WhatsApp us
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
