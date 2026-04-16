import { Suspense } from 'react';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildHomepageMetadata,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
} from '@/lib/seo';
import { MarqueeStrip } from '@/components/ui/MarqueeStrip';
import { CircularCategories } from '@/components/home/CircularCategories';
import { HeroSection } from '@/components/home/HeroSection';
import { TrendingReels } from '@/components/home/TrendingReels';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
import { NewArrivals } from '@/components/home/NewArrivals';
import { BestSellers } from '@/components/home/BestSellers';
import { Testimonials } from '@/components/home/Testimonials';
import { InstagramReels } from '@/components/home/InstagramReels';
import { BrandStory } from '@/components/home/BrandStory';
import { SeenOnYou } from '@/components/home/SeenOnYou';
import { FabricsSection } from '@/components/home/FabricsSection';
import { StatsSection } from '@/components/home/StatsSection';
import HomeSectionsClient from '@/components/home/HomeSectionsClient';

export const revalidate = 60;

export const metadata: Metadata = buildHomepageMetadata();

export default async function Home() {
  // ── Fetch all homepage data in parallel; one failure won't break others ──
  const [
    homepageResult,
    productsResult,
    testimonialsResult,
    collectionsResult,
  ] = await Promise.allSettled([
    api.getHomepageSettings(),
    api.getProducts({ limit: 8, sort: 'newest' }),
    api.getTestimonials(),
    api.getCollections(),
  ]);

  const homepageSettings =
    homepageResult.status === 'fulfilled'
      ? homepageResult.value.settings || {}
      : {};

  // Featured product IDs from admin settings
  const featuredProductIds = homepageSettings.featured_product_ids
    ? homepageSettings.featured_product_ids
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean)
    : [];

  // If admin has specified featured products, fetch those specifically
  let products: unknown[] = [];
  if (featuredProductIds.length > 0) {
    try {
      const featuredResult = await api.getFeaturedProducts(featuredProductIds);
      products = featuredResult.products || [];
    } catch {
      // fall through to products from productsResult below
    }
  }
  if (products.length === 0 && productsResult.status === 'fulfilled') {
    products = productsResult.value.products || [];
  }

  const testimonials =
    testimonialsResult.status === 'fulfilled'
      ? testimonialsResult.value.testimonials || []
      : [];

  const collections =
    collectionsResult.status === 'fulfilled'
      ? (collectionsResult.value.collections || []).slice(0, 2)
      : [];

  // ── Announcement ticker ──
  const isAnnouncementEnabled = Boolean(homepageSettings.announcement_bar_enabled);
  const announcementText = homepageSettings.announcement_bar_text || '';
  const tickerItems = [
    announcementText || 'Complimentary worldwide shipping on orders over Rs. 10,000',
    'Handcrafted by Artisans Since 1987',
    '30-Day Returns & Exchanges',
    'Exclusive Artisan Collections',
  ];

  // ── Stats (admin-configurable) ──
  const statsData = [
    { num: homepageSettings.stat_customer_rating || '4.9 Star Rating', label: 'Customer Rating' },
    { num: homepageSettings.stat_happy_customers || '15,000+', label: 'Happy Customers' },
    { num: homepageSettings.stat_countries_served || '150+', label: 'Countries Served' },
    {
      num:
        homepageSettings.stat_return_policy && homepageSettings.stat_return_policy !== '30-Day'
          ? homepageSettings.stat_return_policy
          : '10+',
      label: 'Years of Crafting',
    },
  ];

  const homepageSchema = [
    buildOrganizationJsonLd(),
    buildWebsiteJsonLd(),
    buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homepageSchema) }}
      />

      {/* ── Announcement ticker ── */}
      {isAnnouncementEnabled && (
        <div
          style={{
            background: 'var(--black)',
            color: 'var(--white)',
            overflow: 'hidden',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              animation: 'ticker 35s linear infinite',
              whiteSpace: 'nowrap',
            }}
          >
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  padding: '0 48px',
                  opacity: 0.9,
                  display: 'inline-block',
                }}
              >
                {item}
                <span
                  style={{
                    display: 'inline-block',
                    width: '4px',
                    height: '4px',
                    background: 'rgba(248,246,243,0.3)',
                    borderRadius: '50%',
                    marginLeft: '48px',
                    verticalAlign: 'middle',
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 1. Circular Categories — mobile horizontal scroll */}
      <Suspense fallback={<div className="h-[120px] bg-white" />}>
        <CircularCategories />
      </Suspense>

      {/* 2. Hero — 751px full-bleed with gradient overlay */}
      <HeroSection />

      {/* 3. Trending Reels — 9:16 cards */}
      <TrendingReels />

      {/* 4. Stats strip */}
      <StatsSection statsData={statsData} />

      {/* 5. Categories Grid — 2-col */}
      <CategoriesGrid />

      {/* 6. Marquee */}
      <MarqueeStrip
        items={[
          'Kashmiri Weaves',
          'Artisanal Luxury',
          'Hand Embroidered',
          'Slow Fashion',
          'Silk Road Heritage',
        ]}
        speed="22s"
      />

      {/* 7. New Arrivals — 2-col product grid */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <NewArrivals products={products as any[]} />

      {/* 8. Best Sellers — horizontal carousel */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <BestSellers products={products as any[]} />

      {/* 9. Customer Testimonials — carousel with nav */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Testimonials testimonials={testimonials as any[]} />

      {/* 10. Instagram Reels — @kvastram section */}
      <InstagramReels />

      {/* 11. Brand Story — dark section */}
      <BrandStory />

      {/* 12. Seen On You — masonry UGC */}
      <SeenOnYou />

      {/* 13. Fabrics — horizontal scroll */}
      <FabricsSection />

      {/* Collections section — kept for existing functionality */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <HomeSectionsClient
        products={[]}
        featuredProductIds={[]}
        testimonialsList={[]}
        collections={collections as any[]}
      />
    </>
  );
}
