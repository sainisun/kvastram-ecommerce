'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { primaryNavItems } from '@/components/layout/navigation';

interface TopHeaderProps {
  pendingOrders: number;
  onMenuOpen: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Kvastram',
  '/dashboard/orders': 'Orders',
  '/dashboard/products': 'Products',
  '/dashboard/customers': 'Customers',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/categories': 'Categories',
  '/dashboard/settings': 'Settings',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/collections': 'Collections',
  '/dashboard/reviews': 'Reviews',
  '/dashboard/returns': 'Returns',
  '/dashboard/wholesale': 'Wholesale',
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // match by prefix (e.g. /dashboard/orders/123 → Orders)
  for (const item of primaryNavItems) {
    if (item.href !== '/dashboard' && pathname.startsWith(item.href)) {
      return item.label;
    }
  }
  return 'Kvastram';
}

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'New Order Received', sub: 'Just now • needs fulfillment', dot: 'bg-[var(--on-tertiary-container)]', read: false },
  { id: 2, title: 'Payment Confirmed', sub: '2 mins ago • order processed', dot: 'bg-[var(--on-tertiary-container)]', read: false },
  { id: 3, title: 'Low Stock Alert', sub: '1 hour ago • check inventory', dot: 'bg-[var(--secondary-container)]', read: true },
  { id: 4, title: 'New Customer Signup', sub: '3 hours ago', dot: 'bg-[var(--outline-variant)]', read: true },
];

export default function TopHeader({ pendingOrders, onMenuOpen }: TopHeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const initial =
    user?.first_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'K';

  const title = getPageTitle(pathname);
  const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length + (pendingOrders > 0 ? 1 : 0);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl flex items-center justify-between px-6 py-4 shadow-[0_12px_32px_-4px_rgba(25,28,30,0.06)] md:left-[240px]">
      {/* Left — hamburger (mobile only) */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="text-[var(--primary)] hover:opacity-70 active:scale-95 transition-all md:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Title — hidden on desktop (sidebar always visible) */}
      <h1 className="font-['Inter'] font-black tracking-[0.2em] text-xl uppercase text-[var(--primary)] md:hidden">
        {title}
      </h1>

      {/* Desktop page title */}
      <h1 className="hidden md:block font-['Inter'] font-black tracking-[0.2em] text-xl uppercase text-[var(--primary)]">
        {title}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(v => !v)}
            className="relative text-[var(--primary)] hover:opacity-70 active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--error)] rounded-full border-2 border-[var(--surface)]" />
            )}
          </button>

          {/* Notification panel */}
          <div
            className={`absolute right-0 mt-4 w-72 bg-[var(--surface-container-lowest)] rounded-xl shadow-[0_12px_32px_-4px_rgba(25,28,30,0.12)] z-50 transition-all duration-200 origin-top-right ${
              notifOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="p-4 border-b border-[var(--surface-container-low)] flex justify-between items-center">
              <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">
                Notifications
              </span>
              <button className="text-[var(--on-tertiary-container)] text-[10px] font-bold">
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {pendingOrders > 0 && (
                <div className="px-4 py-3 hover:bg-[var(--surface-container-low)] transition-colors flex gap-3">
                  <div className="w-2 h-2 mt-1.5 bg-[var(--on-tertiary-container)] rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[var(--on-surface)]">
                      {pendingOrders} Pending Order{pendingOrders > 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">
                      Need fulfillment
                    </p>
                  </div>
                </div>
              )}
              {MOCK_NOTIFICATIONS.map(n => (
                <div key={n.id} className="px-4 py-3 hover:bg-[var(--surface-container-low)] transition-colors flex gap-3">
                  <div className={`w-2 h-2 mt-1.5 ${n.dot} rounded-full flex-shrink-0`} />
                  <div>
                    <p className="text-xs font-bold text-[var(--on-surface)]">{n.title}</p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">{n.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[var(--primary-container)] text-[var(--surface-container-lowest)] flex items-center justify-center text-xs font-bold">
          {initial}
        </div>
      </div>
    </header>
  );
}
