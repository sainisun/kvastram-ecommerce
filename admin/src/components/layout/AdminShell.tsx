'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import MobileBottomTab from '@/components/layout/MobileBottomTab';

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDashboardRoute = pathname.startsWith('/dashboard');

  useEffect(() => {
    if (!isDashboardRoute) return;

    let active = true;
    const load = async () => {
      try {
        const stats = await api.getOrderStats();
        if (active) setPendingOrders(stats?.pending_orders || 0);
      } catch { /* non-critical */ }
    };

    void load();
    const id = window.setInterval(load, 45_000);
    return () => { active = false; window.clearInterval(id); };
  }, [isDashboardRoute, pathname]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // ESC closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!isDashboardRoute) return <>{children}</>;

  return (
    <ProtectedRoute>
      <div data-admin-shell className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)]">

        {/* Drawer overlay */}
        <div
          onClick={() => setDrawerOpen(false)}
          className={`fixed inset-0 z-[60] bg-[var(--primary)]/40 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        <Sidebar
          pendingOrders={pendingOrders}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <div className="relative min-h-screen md:pl-[240px]">
          <TopHeader
            pendingOrders={pendingOrders}
            onMenuOpen={() => setDrawerOpen(true)}
          />

          <main className="min-h-screen pb-28 pt-20 md:pb-10 md:pt-[72px]">
            <div className="mx-auto max-w-[1560px] page-fade" key={pathname}>
              {children}
            </div>
          </main>
        </div>

        <MobileBottomTab
          pendingOrders={pendingOrders}
          isDrawerOpen={drawerOpen}
          onOpenDrawer={() => setDrawerOpen(true)}
          onCloseDrawer={() => setDrawerOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
