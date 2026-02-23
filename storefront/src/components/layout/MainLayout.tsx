'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatWidget } from '@/components/ui/ChatWidget';
import { WholesaleHeader } from '@/components/layout/WholesaleHeader';
import { WholesaleFooter } from '@/components/layout/WholesaleFooter';
import { CartRecovery } from '@/components/cart/CartRecovery';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWholesalePage = pathname?.startsWith('/wholesale');
  const isCheckoutPage = pathname?.startsWith('/checkout');

  return (
    <>
      {isWholesalePage ? <WholesaleHeader /> : <Header />}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {isWholesalePage ? <WholesaleFooter /> : <Footer />}
      {/* PHASE 3.3: Mobile Bottom Navigation - Hide on checkout */}
      {!isCheckoutPage && <BottomNav />}
      {/* PHASE 7.1: Chat Widget - Show on all pages except checkout */}
      {!isCheckoutPage && <ChatWidget />}
      {/* Cart Abandonment Recovery Modal - Hide on checkout */}
      {!isCheckoutPage && <CartRecovery />}
    </>
  );
}
