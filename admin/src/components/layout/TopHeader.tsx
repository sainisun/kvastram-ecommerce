'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Shield, Truck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  getDashboardMode,
  getNavItemsForMode,
} from '@/components/layout/navigation';

interface TopHeaderProps {
  pendingOrders: number;
  onMenuOpen: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Kvastram',
  '/dashboard/orders': 'Orders',
  '/dashboard/fulfillment': 'Fulfillment Analytics',
  '/dashboard/products': 'Products',
  '/dashboard/customers': 'Customers',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/categories': 'Categories',
  '/dashboard/settings': 'Settings',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/collections': 'Collections',
  '/dashboard/reviews': 'Reviews',
  '/dashboard/studio-inquiries': 'Studio Inquiries',
  '/dashboard/returns': 'Returns',
  '/dashboard/wholesale': 'Wholesale Overview',
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const mode = getDashboardMode(pathname);
  const navItems = getNavItemsForMode(mode);

  for (const item of navItems) {
    if (item.href !== '/dashboard' && pathname.startsWith(item.href)) {
      return item.label;
    }
  }

  return mode === 'wholesale' ? 'Wholesale' : 'Kvastram';
}

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Order Received',
    sub: 'Just now - needs shipping',
    dot: 'bg-[var(--on-tertiary-container)]',
    read: false,
  },
  {
    id: 2,
    title: 'Payment Confirmed',
    sub: '2 mins ago - order processed',
    dot: 'bg-[var(--on-tertiary-container)]',
    read: false,
  },
  {
    id: 3,
    title: 'Low Stock Alert',
    sub: '1 hour ago - check inventory',
    dot: 'bg-[var(--secondary-container)]',
    read: true,
  },
  {
    id: 4,
    title: 'New Customer Signup',
    sub: '3 hours ago',
    dot: 'bg-[var(--outline-variant)]',
    read: true,
  },
];

export default function TopHeader({
  pendingOrders,
  onMenuOpen,
}: TopHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const mode = getDashboardMode(pathname);

  const initial =
    user?.first_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'K';

  const title = getPageTitle(pathname);
  const unread =
    MOCK_NOTIFICATIONS.filter((notification) => !notification.read).length +
    (pendingOrders > 0 ? 1 : 0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-[var(--surface)]/80 px-6 py-4 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(25,28,30,0.06)] md:left-[240px]">
      <button
        type="button"
        onClick={onMenuOpen}
        className="text-[var(--primary)] transition-all hover:opacity-70 active:scale-95 md:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-4">
        <h1 className="font-['Inter'] text-xl font-black uppercase tracking-[0.2em] text-[var(--primary)]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((current) => !current)}
            className="relative text-[var(--primary)] transition-all hover:opacity-70 active:scale-95"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-[var(--surface)] bg-[var(--error)]" />
            )}
          </button>

          <div
            className={`absolute right-0 z-50 mt-4 w-72 origin-top-right rounded-xl bg-[var(--surface-container-lowest)] shadow-[0_12px_32px_-4px_rgba(25,28,30,0.12)] transition-all duration-200 ${
              notifOpen
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[var(--surface-container-low)] p-4">
              <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">
                Notifications
              </span>
              <button className="text-[10px] font-bold text-[var(--on-tertiary-container)]">
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {pendingOrders > 0 && (
                <div className="flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-container-low)]">
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--on-tertiary-container)]" />
                  <div>
                    <p className="text-xs font-bold text-[var(--on-surface)]">
                      {pendingOrders} Pending Order
                      {pendingOrders > 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">
                      Needs shipping attention
                    </p>
                  </div>
                </div>
              )}
              {MOCK_NOTIFICATIONS.map((notification) => (
                <div
                  key={notification.id}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-container-low)]"
                >
                  <div
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${notification.dot}`}
                  />
                  <div>
                    <p className="text-xs font-bold text-[var(--on-surface)]">
                      {notification.title}
                    </p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">
                      {notification.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((current) => !current)}
            className="flex items-center gap-2 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-1.5 py-1 text-[var(--primary)] transition-all hover:border-[var(--primary)] active:scale-95"
            aria-label="Admin account"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-container)] text-xs font-bold text-[var(--surface-container-lowest)]">
              {initial}
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--on-surface)] md:block">
              {mode === 'wholesale' ? 'Wholesale' : 'Admin'}
            </span>
            <ChevronDown size={14} className="hidden md:block" />
          </button>

          <div
            className={`absolute right-0 z-50 mt-4 w-72 origin-top-right rounded-xl bg-[var(--surface-container-lowest)] shadow-[0_12px_32px_-4px_rgba(25,28,30,0.12)] transition-all duration-200 ${
              accountOpen
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
            }`}
          >
            <div className="border-b border-[var(--surface-container-low)] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface)]">
                {user?.first_name || 'Admin'}
              </p>
              <p className="mt-1 text-[11px] text-[var(--on-surface-variant)]">
                {user?.email || 'admin@kvastram.com'}
              </p>
            </div>

            <div className="space-y-2 p-3">
              <Link
                href="/dashboard"
                onClick={() => setAccountOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                  mode === 'retail'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]'
                }`}
              >
                <Shield size={16} />
                <div>
                  <p className="font-semibold">Retail dashboard</p>
                  <p
                    className={`text-[11px] ${
                      mode === 'retail'
                        ? 'text-white/80'
                        : 'text-[var(--on-surface-variant)]'
                    }`}
                  >
                    Main admin workspace
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/wholesale"
                onClick={() => setAccountOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                  mode === 'wholesale'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]'
                }`}
              >
                <Truck size={16} />
                <div>
                  <p className="font-semibold">Wholesale dashboard</p>
                  <p
                    className={`text-[11px] ${
                      mode === 'wholesale'
                        ? 'text-white/80'
                        : 'text-[var(--on-surface-variant)]'
                    }`}
                  >
                    B2B inquiries, customers, orders
                  </p>
                </div>
              </Link>
            </div>

            <div className="border-t border-[var(--surface-container-low)] p-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--on-surface)] transition-colors hover:bg-[var(--surface-container-low)]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
