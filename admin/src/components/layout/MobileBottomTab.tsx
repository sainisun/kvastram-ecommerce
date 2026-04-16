'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MoreHorizontal,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { isNavItemActive } from '@/components/layout/navigation';

interface MobileBottomTabProps {
  pendingOrders: number;
  isDrawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
}

type NavTab = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: boolean;
  fab?: boolean;
};

const tabs: NavTab[] = [
  { label: 'Home',      href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Orders',    href: '/dashboard/orders',       icon: ShoppingBag,  badge: true },
  { label: '',          href: '/dashboard/products/new', icon: Package,      fab: true },
  { label: 'Customers', href: '/dashboard/customers',    icon: Users },
];

export default function MobileBottomTab({
  pendingOrders,
  isDrawerOpen,
  onOpenDrawer,
}: MobileBottomTabProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-md z-40 rounded-t-3xl shadow-[0_-8px_24px_-4px_rgba(25,28,30,0.08)] md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isNavItemActive(pathname, tab.href);

        if (tab.fab) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="bg-[var(--primary)] text-white w-14 h-14 rounded-full flex items-center justify-center -mt-10 shadow-lg active:scale-90 duration-150"
              aria-label="Add product"
            >
              <Icon size={22} />
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-90 duration-150 ${
              active ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)] hover:text-[var(--primary)]'
            }`}
          >
            <Icon size={22} />
            <span className="font-['Inter'] text-[10px] font-medium">{tab.label}</span>
            {'badge' in tab && tab.badge && pendingOrders > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-[var(--error)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {pendingOrders > 9 ? '9+' : pendingOrders}
              </span>
            )}
          </Link>
        );
      })}

      {/* More → opens drawer */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-90 duration-150 ${
          isDrawerOpen ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)] hover:text-[var(--primary)]'
        }`}
      >
        <MoreHorizontal size={22} />
        <span className="font-['Inter'] text-[10px] font-medium">More</span>
      </button>
    </nav>
  );
}
