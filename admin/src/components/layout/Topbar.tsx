'use client';

import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function Topbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-16 bg-[var(--kv-card)] border-b border-[var(--kv-border)] fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-8 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kv-muted)]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search for orders, products, customers..."
            suppressHydrationWarning
            className="w-full pl-10 pr-4 py-2 bg-[var(--kv-soft)] border border-[var(--kv-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <button className="relative text-[var(--kv-muted)] hover:text-[var(--kv-text)] transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--kv-danger)]/100 rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-[var(--kv-border)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[var(--kv-text)]">
              {user?.first_name || 'Admin'}
            </p>
            <p className="text-xs text-[var(--kv-muted)] capitalize">
              {user?.role || 'Super Admin'}
            </p>
          </div>
          <div className="relative group cursor-pointer">
            <div className="w-9 h-9 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center border border-violet-200">
              <User size={18} />
            </div>

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--kv-card)] rounded-lg shadow-lg border border-[var(--kv-border)] py-1 hidden group-hover:block">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-[var(--kv-danger)] hover:bg-[var(--kv-danger)]/10 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
