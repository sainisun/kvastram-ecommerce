'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatWidget } from '@/components/ui/ChatWidget';
import { WholesaleHeader } from '@/components/layout/WholesaleHeader';
import { WholesaleFooter } from '@/components/layout/WholesaleFooter';
import { CartRecovery } from '@/components/cart/CartRecovery';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { ArrowUp } from 'lucide-react';
import { PageLoader } from '@/components/ui/PageLoader';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { NewsletterModal } from '@/components/ui/NewsletterModal';

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
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-50 w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-stone-700 transition-all duration-300 hover:-translate-y-1 animate-scale-in"
    >
      <ArrowUp size={18} />
    </button>
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
  const isReelsPage = pathname?.startsWith('/reels');
  const hideSiteChrome = isCheckoutPage || isReelsPage;

  return (
    <>
      {/* Premium Global UI */}
      <PageLoader />
      <ScrollProgress />
      <CustomCursor />
      {/* Subtle noise texture overlay */}
      <div className="noise-overlay" aria-hidden="true" />
      {!isReelsPage && (isWholesalePage ? <WholesaleHeader /> : <Header />)}
      <main id="main-content" tabIndex={-1} className="page-transition">
        {children}
      </main>
      {!isReelsPage && (isWholesalePage ? <WholesaleFooter /> : <Footer />)}
      {/* Mobile Bottom Navigation - Hide on checkout */}
      {!isCheckoutPage && <BottomNav />}
      {/* Scroll to top */}
      {!hideSiteChrome && <ScrollToTop />}
      {/* Chat Widget */}
      {!hideSiteChrome && <ChatWidget />}
      {/* Cart Abandonment Recovery Modal */}
      {!hideSiteChrome && <CartRecovery />}
      {/* Cookie Consent */}
      {!hideSiteChrome && !isWholesalePage && <CookieConsent />}
      {!hideSiteChrome && !isWholesalePage && <NewsletterModal />}
    </>
  );
}
