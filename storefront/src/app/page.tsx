import { api } from '@/lib/api';
import type { Metadata } from 'next';
import { MarqueeStrip } from '@/components/ui/MarqueeStrip';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { StatsSection } from '@/components/home/StatsSection';
import { CategorySection } from '@/components/home/CategorySection';
import HomeSectionsClient from '@/components/home/HomeSectionsClient';
import { CommunitySection } from '@/components/home/CommunitySection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { CategoryCircles } from '@/components/home/CategoryCircles';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TrendingReels } from '@/components/home/TrendingReels';

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

  const [categoriesData, collectionsData, testimonialsData] = await Promise.all([
    api.getCategories(),
    api.getCollections(),
    api.getTestimonials(),
  ]);

  const products = productsData.products || [];
  const categories = (categoriesData.categories || []).slice(0, 3);
  const collections = (collectionsData.collections || []).slice(0, 2);
  const testimonialsList = testimonialsData.testimonials || [];

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
          <div className="block md:hidden">
            <CategoryCircles />
          </div>
          {isAnnouncementEnabled ? (
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
                  gap: 0,
                }}
              >
                {[...tickerItems, ...tickerItems].map((item, i) => (
                  <span
                    key={i}
                    style={{
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
          ) : null}

          <HeroBanner />
          <TrendingReels />

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
