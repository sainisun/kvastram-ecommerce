'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { WholesaleHeader } from '@/components/layout/WholesaleHeader';
import { WholesaleFooter } from '@/components/layout/WholesaleFooter';
import { CartRecovery } from '@/components/cart/CartRecovery';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { ArrowUp } from 'lucide-react';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { NewsletterModal } from '@/components/ui/NewsletterModal';
import { UnstyledButton } from '@/components/ui/Button';
import { ChatWidget } from '@/components/ui/ChatWidget';

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const syncViewport = () => {
      setIsMobile(mediaQuery.matches);
      if (mediaQuery.matches) {
        setVisible(false);
      } else {
        setVisible(window.scrollY > 500);
      }
    };

    const onScroll = () => {
      if (!mediaQuery.matches) {
        setVisible(window.scrollY > 500);
      }
    };

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      mediaQuery.removeEventListener('change', syncViewport);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (isMobile || !visible) return null;

  return (
    <UnstyledButton
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-50 w-10 h-10 bg-[var(--ds-text-primary)] text-inverse rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--ds-text-secondary)] transition-all duration-300 hover:-translate-y-1 animate-scale-in"
    >
      <ArrowUp size={18} />
    </UnstyledButton>
  );
}

export function MainLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWholesalePage = pathname?.startsWith('/wholesale');
  const isCheckoutPage = pathname?.startsWith('/checkout');
  const hideSiteChrome = isCheckoutPage;

  return (
    <>
      <ScrollProgress />
      {isWholesalePage ? <WholesaleHeader /> : <SiteHeader />}
      <main id="main-content" tabIndex={-1} className="page-transition">
        {children}
      </main>
      {isWholesalePage ? <WholesaleFooter /> : <Footer />}
      {/* Mobile Bottom Navigation - Hide on immersive/checkout surfaces */}
      {!hideSiteChrome && <BottomNav />}
      {/* Scroll to top */}
      {!hideSiteChrome && <ScrollToTop />}
      {/* Cart Abandonment Recovery Modal */}
      {!hideSiteChrome && <CartRecovery />}
      {/* Cookie Consent */}
      {!hideSiteChrome && !isWholesalePage && <CookieConsent />}
      {!hideSiteChrome && !isWholesalePage && <NewsletterModal />}
      {!hideSiteChrome && !isWholesalePage && <ChatWidget />}
    </>
  );
}
