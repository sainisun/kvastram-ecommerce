import ProductCarousel from '@/components/ProductCarousel';
import HeroCarousel from '@/components/hero/HeroCarousel';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import NewsletterForm from '@/components/NewsletterForm';
import { api } from '@/lib/api';
import type { Metadata } from 'next';
import { MarqueeStrip } from '@/components/ui/MarqueeStrip';
import { RevealOnScroll, StatReveal } from '@/components/ui/RevealOnScroll';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { CategorySection } from '@/components/home/CategorySection';
import HomeSectionsClient from '@/components/home/HomeSectionsClient';
import { CommunitySection } from '@/components/home/CommunitySection';
import { NewsletterSection } from '@/components/home/NewsletterSection';

interface Banner {
  id: string;
  section: string;
  is_active: boolean;
  image?: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface Product {
  id: string;
  title: string;
  handle?: string;
  thumbnail?: string;
  collection?: { title: string };
  variants?: Array<{
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: string;
}

export const dynamic = 'force-dynamic';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kvastram.com';

export const metadata: Metadata = {
  title: 'Kvastram | Artisanal Luxury Fashion',
  description:
    'Premium clothing for the global citizen. Discover artisan-crafted fashion with worldwide shipping.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Kvastram',
    title: 'Kvastram | Artisanal Luxury Fashion',
    description: 'Premium clothing for the global citizen.',
  },
};

export default async function Home() {
  // ─── All existing API calls preserved exactly ───
  const homepageData = await api.getHomepageSettings();
  const homepageSettings = homepageData.settings || {};

  const featuredProductIds = homepageSettings.featured_product_ids
    ? homepageSettings.featured_product_ids
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean)
    : [];

  let productsData;
  if (featuredProductIds.length > 0) {
    productsData = await api.getFeaturedProducts(featuredProductIds);
  } else {
    productsData = await api.getProducts({ limit: 8, sort: 'newest' });
  }

  const [categoriesData, collectionsData, testimonialsData, bannersData] =
    await Promise.all([
      api.getCategories(),
      api.getCollections(),
      api.getTestimonials(),
      api.getBanners(),
    ]);

  const products = productsData.products || [];
  const categories = (categoriesData.categories || []).slice(0, 3);
  const collections = (collectionsData.collections || []).slice(0, 2);
  const testimonialsList = testimonialsData.testimonials || [];
  // Hero banners: only 'hero' section banners passed to HeroCarousel
  const heroBanners = (bannersData.banners || []).filter(
    (b: Banner) => b.section === 'hero' && b.is_active
  );

  const categoryImages: Record<string, string> = {
    sarees: '/images/home/category-sarees.jpg',
    lehengas: '/images/home/category-lehengas.jpg',
    kurtas: '/images/home/category-kurtas.jpg',
    accessories: '/images/home/category-accessories.jpg',
  };

  const isAnnouncementEnabled = Boolean(
    homepageSettings.announcement_bar_enabled
  );
  const announcementText = homepageSettings.announcement_bar_text || '';

  // Ticker items for marquee
  const tickerItems = [
    announcementText ||
      'Complimentary Worldwide Shipping on Orders Over ₹10,000',
    'Handcrafted by Artisans Since 1987',
    '30-Day Returns & Exchanges',
    'Exclusive Artisan Collections',
  ];

  // Stats data — admin se configurable, defaults as fallback
  const statsData = [
    {
      num: homepageSettings.stat_customer_rating || '4.9★',
      label: 'Customer Rating',
    },
    {
      num: homepageSettings.stat_happy_customers || '15,000+',
      label: 'Happy Customers',
    },
    {
      num: homepageSettings.stat_countries_served || '150+',
      label: 'Countries Served',
    },
    {
      num: homepageSettings.stat_return_policy || '30-Day',
      label: 'Free Returns',
    },
  ];

  return (
    <>
      {/* Reveal observer — client component wrapper */}
      <RevealOnScroll>
        <div className="min-h-screen" style={{ background: 'var(--white)' }}>
          <HeroSection
            isAnnouncementEnabled={isAnnouncementEnabled}
            announcementText={announcementText}
            tickerItems={tickerItems}
            heroBanners={heroBanners}
          />

          <StatsSection statsData={statsData} />

          <CategorySection categories={categories} categoryImages={categoryImages} />

          {/* ═══ 5. MARQUEE STRIP ═══ */}
          <MarqueeStrip
            items={[
              'Kashmiri Weaves',
              'Artisanal Luxury',
              'Hand Embroidered',
              'Slow Fashion',
              'Florentine Leather',
              'Silk Road Heritage',
            ]}
            speed="22s"
          />

          <HomeSectionsClient
            products={products}
            featuredProductIds={featuredProductIds}
            homepageSettings={homepageSettings}
            testimonialsList={testimonialsList}
            collections={collections}
            categories={categories}
            categoryImages={categoryImages}
          />

          {/* ═══ DIVIDER ═══ */}
          <div className="divider-text-prem">
            <span>The Community</span>
          </div>

          <CommunitySection
            communityItems={[
              {
                gradient: 'from-stone-200 to-stone-300',
                user: '@aria.styles',
                caption: 'This pashmina is everything ❤️✨',
                tag: 'New Arrival',
              },
              {
                gradient: 'from-amber-100 to-amber-200',
                user: '@luxe.by.nina',
                caption: "Wearing the silk kurta to my sister's wedding 💛",
                tag: 'Wedding Season',
              },
              {
                gradient: 'from-rose-100 to-rose-200',
                user: '@mira.edits',
                caption: 'The quality is unmatched — worth every penny',
                tag: null,
              },
              {
                gradient: 'from-stone-300 to-stone-400',
                user: '@fatima.looks',
                caption: 'So soft, so elegant. My new favourite piece!',
                tag: 'Bestseller',
              },
              {
                gradient: 'from-teal-100 to-teal-200',
                user: '@style.by.aisha',
                caption: 'Gifted this to my mum — she cried happy tears 😭',
                tag: null,
              },
              {
                gradient: 'from-purple-100 to-purple-200',
                user: '@priya.ootd',
                caption: 'The cashmere cardigan is pure luxury, obsessed!',
                tag: 'Most Loved',
              },
            ]}
          />

          {/* ═══ MARQUEE 2 ═══ */}
          <MarqueeStrip
            items={[
              'Authentic Craftsmanship',
              'Sustainably Made',
              'Worldwide Shipping',
              'Premium Materials',
              'Artisan Heritage',
            ]}
            speed="25s"
          />

          <NewsletterSection
            newsletterTitle={homepageSettings.newsletter_title}
            newsletterSubtitle={homepageSettings.newsletter_subtitle}
          />
        </div>
      </RevealOnScroll>
    </>
  );
}
