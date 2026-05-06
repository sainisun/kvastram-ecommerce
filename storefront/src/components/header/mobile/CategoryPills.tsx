'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../header.module.css';

interface Pill {
  label: string;
  href: string;
}

const DEFAULT_PILLS: Pill[] = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Jackets', href: '/categories/jackets' },
  { label: 'Sarees', href: '/categories/sarees' },
  { label: 'Tote Bags', href: '/categories/tote-bags' },
  { label: 'Suits & Kurtas', href: '/categories/suits-kurtas' },
  { label: 'Gifts ₹2K', href: '/collections/gifts-under-2000' },
];

interface CategoryPillsProps {
  pills?: Pill[];
}

export function CategoryPills({ pills = DEFAULT_PILLS }: CategoryPillsProps) {
  const pathname = usePathname();

  return (
    <div
      className={`flex md:hidden gap-5 overflow-x-auto px-4 py-2 bg-[#f7f4ef] border-b border-[#d8d2c8] h-[44px] items-center ${styles.scrollbarNone}`}
      role="tablist"
      aria-label="Category quick links"
    >
      {pills.map((pill) => {
        const isActive = pathname === pill.href;
        return (
          <Link
            key={pill.href}
            href={pill.href}
            role="tab"
            aria-selected={isActive}
            className={[
              'flex-shrink-0 font-[family-name:var(--font-ui)] text-[11px] tracking-[0.04em] transition-colors whitespace-nowrap underline-offset-4',
              isActive
                ? 'text-[#1a1714] underline'
                : 'text-[#7a7570] hover:text-[#1a1714] hover:underline',
            ].join(' ')}
          >
            {pill.label}
          </Link>
        );
      })}
    </div>
  );
}
