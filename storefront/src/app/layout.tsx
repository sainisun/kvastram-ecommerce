import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';

import './globals.css';
import { Analytics } from '@/components/Analytics';
import { MainLayout } from '@/components/layout/MainLayout';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { CurrencyProvider } from '@/context/currency-context';
import { NotificationProvider } from '@/context/notification-context';
import { RecentlyViewedProvider } from '@/context/recently-viewed-context';
import { ShopProvider } from '@/context/shop-context';
import { WholesaleCartProvider } from '@/context/wholesale-cart-context';
import { WholesaleProvider } from '@/context/wholesale-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { LogRocketProvider } from '@/components/LogRocketProvider';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Indian Ethnic Wear | ${SITE_NAME}`,
  description:
    'Shop handcrafted kurtis, shawls, sarees, wraps and artisanal ethnic wear for women at Kvastram.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `Indian Ethnic Wear | ${SITE_NAME}`,
    description:
      'Shop handcrafted kurtis, shawls, sarees, wraps and artisanal ethnic wear for women at Kvastram.',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: `${SITE_NAME} handcrafted Indian ethnic wear`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Indian Ethnic Wear | ${SITE_NAME}`,
    description:
      'Shop handcrafted kurtis, shawls, sarees, wraps and artisanal ethnic wear for women at Kvastram.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const csrfToken = await import('@/lib/csrf').then((module) =>
    module.CsrfManager.getServerToken()
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
        />
        <link rel="preconnect" href={SITE_URL} />
        {csrfToken && <meta name="csrf-token" content={csrfToken} />}
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/${process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID}';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
                })();
              `,
            }}
          />
        )}
      </head>
      <body
        className={`${cormorant.variable} ${jost.variable} font-body antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>

        <RootErrorBoundary>
          <NotificationProvider>
            <CurrencyProvider>
            <ShopProvider>
              <AuthProvider>
                <LogRocketProvider>
                  <CartProvider>
                    <WholesaleCartProvider>
                      <WishlistProvider>
                        <RecentlyViewedProvider>
                          <WholesaleProvider>
                            <MainLayout>{children}</MainLayout>
                          </WholesaleProvider>
                        </RecentlyViewedProvider>
                      </WishlistProvider>
                    </WholesaleCartProvider>
                  </CartProvider>
                </LogRocketProvider>
              </AuthProvider>
            </ShopProvider>
            </CurrencyProvider>
          </NotificationProvider>
        </RootErrorBoundary>
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  );
}
