'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATEGORY_QUICK_LINKS, type StorefrontNavLink } from '@/config/storefront-navigation';
import styles from '../header.module.css';

interface CategoryPillsProps {
  pills?: StorefrontNavLink[];
}

export function CategoryPills({ pills = CATEGORY_QUICK_LINKS }: CategoryPillsProps) {
  const pathname = usePathname();

  return (
    <div
      className={`flex md:hidden gap-5 overflow-x-auto px-4 py-2 bg-[var(--ds-surface-parchment)] border-b border-[var(--ds-border-subtle)] h-[44px] items-center ${styles.scrollbarNone}`}
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
                ? 'text-[var(--ds-text-primary)] underline'
                : 'text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] hover:underline',
            ].join(' ')}
          >
            {pill.label}
          </Link>
        );
      })}
    </div>
  );
}
