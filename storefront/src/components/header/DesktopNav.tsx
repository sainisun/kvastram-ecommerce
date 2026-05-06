'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useCallback } from 'react';

interface NavItem {
  label: string;
  href: string;
  hasMega?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Shop', href: '/products', hasMega: true },
  { label: 'Collections', href: '/collections', hasMega: true },
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'About', href: '/about' },
];

interface DesktopNavProps {
  activeMega: string | null;
  onMegaEnter: (label: string) => void;
  onMegaLeave: () => void;
}

export function DesktopNav({ activeMega, onMegaEnter, onMegaLeave }: DesktopNavProps) {
  const pathname = usePathname();
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback((label: string, hasMega?: boolean) => {
    if (!hasMega) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => onMegaEnter(label), 120);
  }, [onMegaEnter]);

  const handleLeave = useCallback(() => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(onMegaLeave, 180);
  }, [onMegaLeave]);

  return (
    <nav className="flex items-center gap-9" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const isMegaOpen = activeMega === item.label;

        return (
          <div
            key={item.label}
            onMouseEnter={() => handleEnter(item.label, item.hasMega)}
            onMouseLeave={handleLeave}
          >
            <Link
              href={item.href}
              className={[
                'font-[family-name:var(--font-ui)] text-[12px] uppercase tracking-[0.08em] pb-1 transition-colors',
                isActive || isMegaOpen
                  ? 'text-[#c94e2a] border-b border-[#c94e2a]'
                  : 'text-[#3d3a36] hover:text-[#1a1714] hover:border-b hover:border-[#b5b0a8]',
              ].join(' ')}
              aria-haspopup={item.hasMega ? 'true' : undefined}
              aria-expanded={item.hasMega ? isMegaOpen : undefined}
            >
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
