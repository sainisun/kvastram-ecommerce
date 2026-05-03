'use client';

import { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { DrawerNavItem } from './DrawerNavItem';

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
      { label: 'Gifts Under ₹2,000', href: '/collections/gifts-under-2000' },
    ],
  },
];

const NAV_ITEMS = [
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
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'About', href: '/about' },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  expandedItem: string | null;
  onToggleItem: (label: string) => void;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '919999999999';

export function MobileDrawer({ isOpen, onClose, expandedItem, onToggleItem }: MobileDrawerProps) {
  const pathname = usePathname();

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on route change
  useEffect(() => { onClose(); }, [pathname, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[rgba(26,23,20,0.5)] md:hidden"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 w-full bg-white flex flex-col md:hidden"
            aria-modal="true"
            role="dialog"
            aria-label="Navigation"
          >
            {/* Top spacer (aligns with MobileTopBar) */}
            <div className="h-[54px] shrink-0" />

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
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

            {/* Bottom CTA bar */}
            <div className="shrink-0 border-t border-[#d8d2c8] p-3 flex gap-2 bg-white">
              <a
                href="/orders"
                className="flex-1 py-2.5 rounded-md font-[family-name:var(--font-ui)] text-[11px] font-medium uppercase tracking-[0.06em] border border-[#d8d2c8] text-[#3d3a36] text-center"
              >
                Track order
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I need help`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-md font-[family-name:var(--font-ui)] text-[11px] font-medium uppercase tracking-[0.06em] bg-[#c94e2a] text-white text-center"
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
