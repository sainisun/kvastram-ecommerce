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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isDashboardRoute = pathname.startsWith('/dashboard');

  useEffect(() => {
    if (!isDashboardRoute) {
      return;
    }

    let active = true;

    const loadShellCounts = async () => {
      try {
        const stats = await api.getOrderStats();
        if (active) {
          setPendingOrders(stats?.pending_orders || 0);
        }
      } catch (error) {
        console.error('Failed to load admin shell counts:', error);
      }
    };

    void loadShellCounts();
    const intervalId = window.setInterval(loadShellCounts, 45000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isDashboardRoute, pathname]);

  if (!isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div
        data-admin-shell
        className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,125,78,0.16),_transparent_36%),linear-gradient(180deg,#fdfbf8_0%,#f9f7f4_46%,#f4efe8_100%)] text-[var(--kv-text)]"
      >
        <Sidebar pendingOrders={pendingOrders} />

        <div className="relative min-h-screen md:pl-[240px]">
          <TopHeader
            pendingOrders={pendingOrders}
            onMenuOpen={() => setMobileDrawerOpen(true)}
          />

          <main className="min-h-screen pb-28 pt-20 md:pb-10 md:pt-10">
            <div className="mx-auto max-w-[1560px]">{children}</div>
          </main>
        </div>

        <MobileBottomTab
          pendingOrders={pendingOrders}
          isDrawerOpen={mobileDrawerOpen}
          onOpenDrawer={() => setMobileDrawerOpen(true)}
          onCloseDrawer={() => setMobileDrawerOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
