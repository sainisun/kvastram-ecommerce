'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { DrawerSubSection } from './DrawerSubSection';
import { Button } from '@/components/ui/Button';

interface SubItem {
  label: string;
  href: string;
}

interface SubSection {
  label: string;
  items: SubItem[];
}

interface DrawerNavItemProps {
  label: string;
  href: string;
  isActive?: boolean;
  isExpanded?: boolean;
  subSections?: SubSection[];
  viewAllLabel?: string;
  viewAllHref?: string;
  onToggle?: () => void;
  onClose: () => void;
}

export function DrawerNavItem({
  label,
  href,
  isActive,
  isExpanded,
  subSections,
  viewAllLabel,
  viewAllHref,
  onToggle,
  onClose,
}: DrawerNavItemProps) {
  const hasChildren = subSections && subSections.length > 0;

  return (
    <div className="border-b border-[var(--ds-surface-warm)]">
      {hasChildren ? (
        <Button
          type="button"
          onClick={onToggle}
          variant="ghost"
          size="md"
          className={[
            'w-full justify-between px-4 py-[13px] font-body text-[14px] normal-case',
            isActive ? 'text-[var(--ds-accent-primary)]' : 'text-[var(--ds-text-primary)]',
            'hover:bg-[var(--ds-surface-parchment)]',
          ].join(' ')}
        >
          {label}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 text-[var(--ds-text-muted)] ${isExpanded ? 'rotate-180' : ''}`}
          />
        </Button>
      ) : (
        <Link
          href={href}
          onClick={onClose}
          className={[
            'flex items-center px-4 py-[13px] font-body text-[14px] transition-colors',
            isActive ? 'text-[var(--ds-accent-primary)]' : 'text-[var(--ds-text-primary)]',
            'hover:bg-[var(--ds-surface-parchment)]',
          ].join(' ')}
        >
          {label}
        </Link>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <DrawerSubSection
              sections={subSections!}
              viewAllLabel={viewAllLabel ?? 'View all'}
              viewAllHref={viewAllHref ?? href}
              onClose={onClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
