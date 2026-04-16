'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  PackagePlus,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  isNavItemActive,
  moreNavItems,
  primaryNavItems,
} from '@/components/layout/navigation';

interface MobileBottomTabProps {
  pendingOrders: number;
  isDrawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
}

const tabs = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Orders',
    href: '/dashboard/orders',
    icon: ShoppingBag,
    badge: 'pendingOrders' as const,
  },
  {
    label: 'Add Product',
    href: '/dashboard/products/new',
    icon: PackagePlus,
    accent: true,
  },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
];

export default function MobileBottomTab({
  pendingOrders,
  isDrawerOpen,
  onOpenDrawer,
  onCloseDrawer,
}: MobileBottomTabProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={onCloseDrawer}
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border border-[var(--kv-border)] bg-[var(--kv-card)] p-5 shadow-[0_-24px_60px_rgba(26,26,26,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-[var(--font-display)] text-2xl text-[var(--kv-text)]">
                  More tools
                </p>
                <p className="text-sm text-[var(--kv-muted)]">
                  Everything else in the admin panel.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseDrawer}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-soft)] text-[var(--kv-text)]"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[...primaryNavItems.slice(4), ...moreNavItems].map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseDrawer}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      active
                        ? 'border-[var(--kv-accent)] bg-[var(--kv-accent-soft)] text-[var(--kv-text)]'
                        : 'border-[var(--kv-border)] bg-white text-[var(--kv-text)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--kv-soft)]">
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-[var(--kv-muted)]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--kv-danger)]/20 bg-[var(--kv-danger)]/6 px-4 py-3 text-sm font-semibold text-[var(--kv-danger)]"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--kv-border)] bg-[color:var(--kv-card)]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isNavItemActive(pathname, tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                  active
                    ? 'bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                    : 'text-[var(--kv-muted)]'
                } ${tab.accent ? 'bg-[var(--kv-accent)] text-white' : ''}`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.badge === 'pendingOrders' && pendingOrders > 0 ? (
                  <span className="absolute right-3 top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--kv-danger)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {pendingOrders > 9 ? '9+' : pendingOrders}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onOpenDrawer}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
              isDrawerOpen
                ? 'bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                : 'text-[var(--kv-muted)]'
            }`}
          >
            <MoreHorizontal size={18} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
