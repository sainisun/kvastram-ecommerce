'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  isNavItemActive,
  moreNavItems,
  primaryNavItems,
} from '@/components/layout/navigation';

export default function Sidebar({
  pendingOrders,
}: {
  pendingOrders: number;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] border-r border-[rgba(255,255,255,0.08)] bg-[var(--kv-sidebar-bg)] p-4 md:flex md:flex-col">
      <div className="rounded-[28px] border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.20)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kv-accent)] text-lg font-semibold text-white">
            K
          </div>
          <div>
            <p className="font-[var(--font-display)] text-[1.55rem] leading-none tracking-[0.14em] text-white">
              KVASTRAM
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[var(--kv-sidebar-text)]">
              Seller Studio
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--kv-sidebar-text)]">
            Admin
          </p>
          <p className="mt-2 text-base font-semibold text-white">
            {user?.first_name || 'Kvastram Admin'}
          </p>
          <p className="text-sm text-[var(--kv-sidebar-text)] capitalize">
            {user?.role || 'super admin'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <section>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--kv-sidebar-text)] opacity-60">
              Main
            </p>
            <nav className="mt-3 space-y-1.5">
              {primaryNavItems.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-2xl border-l-4 px-3 py-3 transition ${
                      active
                        ? 'border-[var(--kv-accent)] bg-[var(--kv-sidebar-active-bg)] text-white'
                        : 'border-transparent text-[var(--kv-sidebar-text)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                        active
                          ? 'bg-[var(--kv-accent)] text-white'
                          : 'bg-[rgba(255,255,255,0.08)] text-[var(--kv-sidebar-text)] group-hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className={`block truncate text-xs ${active ? 'text-[var(--kv-sidebar-text)]' : 'text-[var(--kv-sidebar-text)] opacity-70'}`}>
                        {item.description}
                      </span>
                    </span>
                    {item.badge === 'pendingOrders' && pendingOrders > 0 ? (
                      <span className="rounded-full bg-[var(--kv-danger)] px-2 py-0.5 text-xs font-semibold text-white">
                        {pendingOrders}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </section>

          <section>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--kv-sidebar-text)] opacity-60">
              More Tools
            </p>
            <nav className="mt-3 space-y-1.5">
              {moreNavItems.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-2xl border-l-4 px-3 py-3 transition ${
                      active
                        ? 'border-[var(--kv-accent)] bg-[var(--kv-sidebar-active-bg)] text-white'
                        : 'border-transparent text-[var(--kv-sidebar-text)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                    }`}
                  >
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-[var(--kv-accent)]' : 'bg-[rgba(255,255,255,0.08)]'}`}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-[var(--kv-sidebar-text)] opacity-70">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </section>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm font-semibold text-[var(--kv-sidebar-text)] transition hover:bg-[rgba(255,255,255,0.12)] hover:text-white"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.08)]">
            <LogOut size={18} />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}
