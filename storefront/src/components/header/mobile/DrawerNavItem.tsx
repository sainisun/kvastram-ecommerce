'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { DrawerSubSection } from './DrawerSubSection';

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
    <div className="border-b border-[#e8e2d9]">
      {hasChildren ? (
        <button
          onClick={onToggle}
          className={[
            'w-full flex items-center justify-between px-4 py-[13px] font-[family-name:var(--font-ui)] text-[14px] transition-colors',
            isActive ? 'text-[#c94e2a]' : 'text-[#1a1714]',
            'hover:bg-[#f7f4ef]',
          ].join(' ')}
        >
          {label}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 text-[#7a7570] ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      ) : (
        <Link
          href={href}
          onClick={onClose}
          className={[
            'flex items-center px-4 py-[13px] font-[family-name:var(--font-ui)] text-[14px] transition-colors',
            isActive ? 'text-[#c94e2a]' : 'text-[#1a1714]',
            'hover:bg-[#f7f4ef]',
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
