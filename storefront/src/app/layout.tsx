
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/context/shop-context";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { NotificationProvider } from "@/context/notification-context";
import { RecentlyViewedProvider } from "@/context/recently-viewed-context";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Analytics } from "@/components/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kvastram.com';

export const metadata: Metadata = {
  title: "Kvastram | Modern International Fashion",
  description: "Premium clothing for the global citizen.",
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
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'} />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} antialiased bg-white text-stone-900`}
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
                <CartProvider>
                  <WishlistProvider>
                    <RecentlyViewedProvider>
                      <MainLayout>{children}</MainLayout>
                    </RecentlyViewedProvider>
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </ShopProvider>
          </NotificationProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
