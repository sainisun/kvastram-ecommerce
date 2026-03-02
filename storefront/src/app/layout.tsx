import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond, Archivo } from 'next/font/google';

import './globals.css';
import { ShopProvider } from '@/context/shop-context';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { NotificationProvider } from '@/context/notification-context';
import { RecentlyViewedProvider } from '@/context/recently-viewed-context';
import { WholesaleProvider } from '@/context/wholesale-context';
import { WholesaleCartProvider } from '@/context/wholesale-cart-context';
import { MainLayout } from '@/components/layout/MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Analytics } from '@/components/Analytics';
import { LogRocketProvider } from '@/components/LogRocketProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500'],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kvastram.com';

export const metadata: Metadata = {
  title: 'Kvastram — Artisanal Fashion from the Heart of India',
  description:
    'Discover handcrafted luxury fashion — premium shawls, kurtis, sarees, and more, shipped worldwide. Free returns, 30-day guarantee.',
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Kvastram',
    title: 'Kvastram | Modern International Fashion',
    description: 'Premium clothing for the global citizen.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kvastram | Modern International Fashion',
    description: 'Premium clothing for the global citizen.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to API and CDN for faster loading */}
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
        />
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Tawk.to Chat Widget */}
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

        {/* Preload critical fonts - use Google Fonts URL */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} ${cormorant.variable} ${archivo.variable} antialiased`}
      >
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-stone-900 focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>

        <ErrorBoundary>
          <NotificationProvider>
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
          </NotificationProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
