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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] border-r border-[var(--kv-border)] bg-[color:var(--kv-card)]/96 p-4 backdrop-blur md:flex md:flex-col">
      <div className="rounded-[28px] border border-[var(--kv-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,247,244,0.92))] p-5 shadow-[0_20px_40px_rgba(26,26,26,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kv-text)] text-lg font-semibold text-white">
            K
          </div>
          <div>
            <p className="font-[var(--font-display)] text-[1.55rem] leading-none tracking-[0.14em] text-[var(--kv-text)]">
              KVASTRAM
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[var(--kv-muted)]">
              Seller Studio
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-soft)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--kv-muted)]">
            Admin
          </p>
          <p className="mt-2 text-base font-semibold text-[var(--kv-text)]">
            {user?.first_name || 'Kvastram Admin'}
          </p>
          <p className="text-sm text-[var(--kv-muted)] capitalize">
            {user?.role || 'super admin'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <section>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--kv-muted)]">
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
                        ? 'border-[var(--kv-accent)] bg-[var(--kv-accent-soft)] text-[var(--kv-text)]'
                        : 'border-transparent text-[var(--kv-muted)] hover:bg-[var(--kv-soft)] hover:text-[var(--kv-text)]'
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                        active
                          ? 'bg-white text-[var(--kv-accent-deep)]'
                          : 'bg-[var(--kv-soft)] text-[var(--kv-muted)] group-hover:text-[var(--kv-text)]'
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-[var(--kv-muted)]">
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
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--kv-muted)]">
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
                        ? 'border-[var(--kv-accent)] bg-[var(--kv-accent-soft)] text-[var(--kv-text)]'
                        : 'border-transparent text-[var(--kv-muted)] hover:bg-[var(--kv-soft)] hover:text-[var(--kv-text)]'
                    }`}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--kv-soft)]">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-[var(--kv-muted)]">
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
          className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-[var(--kv-danger)]/20 bg-[var(--kv-danger)]/6 px-4 py-3 text-sm font-semibold text-[var(--kv-danger)] transition hover:bg-[var(--kv-danger)]/10"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
            <LogOut size={18} />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}
