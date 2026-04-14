'use client';

import { Bell, Menu, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface TopHeaderProps {
  pendingOrders: number;
  onMenuOpen: () => void;
}

export default function TopHeader({
  pendingOrders,
  onMenuOpen,
}: TopHeaderProps) {
  const { user } = useAuth();
  const initial =
    user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || null;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--kv-border)] bg-[color:var(--kv-card)]/95 backdrop-blur md:hidden">
      <div className="flex h-[72px] items-center justify-between px-4">
        <button
          type="button"
          onClick={onMenuOpen}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-soft)] text-[var(--kv-text)] transition hover:border-[var(--kv-accent)]/40"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="text-center">
          <p className="font-[var(--font-display)] text-[1.35rem] leading-none tracking-[0.14em] text-[var(--kv-text)]">
            KVASTRAM
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-[var(--kv-muted)]">
            Seller Studio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-soft)] text-[var(--kv-text)]"
            aria-label="Pending orders"
          >
            <Bell size={18} />
            {pendingOrders > 0 ? (
              <span className="absolute right-1.5 top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--kv-danger)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {pendingOrders > 9 ? '9+' : pendingOrders}
              </span>
            ) : null}
          </button>

          <div className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-[var(--kv-text)] px-3 text-sm font-semibold text-white">
            {initial || <User size={16} />}
          </div>
        </div>
      </div>
    </header>
  );
}
