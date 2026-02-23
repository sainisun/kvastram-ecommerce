'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || '';

function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    if (typeof window.gtag === 'function') {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView', {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${GA_MEASUREMENT_ID}');
                    `,
        }}
      />

      {/* Facebook Pixel */}
      {FB_PIXEL_ID && (
        <>
          <Script
            id="fb-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                                    !function(f,b,e,v,n,t,s)
                                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                                    n.queue=[];t=b.createElement(e);t.async=!0;
                                    t.src=v;s=b.getElementsByTagName(e)[0];
                                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                                    'https://connect.facebook.net/en_US/fbevents.js');
                                    fbq('init', '${FB_PIXEL_ID}');
                                    fbq('track', 'PageView');
                                `,
            }}
          />
        </>
      )}

      {/* Page view tracking */}
      <Suspense fallback={null}>
        <AnalyticsInner />
      </Suspense>
    </>
  );
}

// Event tracking helpers
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  }
}

export function trackAddToCart(
  product: { id: string; name: string; price: number; currency: string },
  quantity: number = 1
) {
  trackEvent('add_to_cart', {
    currency: product.currency,
    value: (product.price / 100) * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price / 100,
        quantity: quantity,
      },
    ],
  });
}

export function trackBeginCheckout(
  total: number,
  currency: string,
  items: any[]
) {
  trackEvent('begin_checkout', {
    currency,
    value: total / 100,
    items,
  });
}

export function trackPurchase(
  transactionId: string,
  total: number,
  currency: string,
  items: any[]
) {
  trackEvent('purchase', {
    transaction_id: transactionId,
    currency,
    value: total / 100,
    items,
  });
}
