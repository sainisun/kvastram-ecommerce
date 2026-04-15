import { api } from '@/lib/api';
import type { Metadata } from 'next';
import { MarqueeStrip } from '@/components/ui/MarqueeStrip';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { StatsSection } from '@/components/home/StatsSection';
import { CategorySection } from '@/components/home/CategorySection';
import HomeSectionsClient from '@/components/home/HomeSectionsClient';
import { CommunitySection } from '@/components/home/CommunitySection';
import { CategoryCircles } from '@/components/home/CategoryCircles';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TrendingReels } from '@/components/home/TrendingReels';
import {
  buildBreadcrumbJsonLd,
  buildHomepageMetadata,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

export const revalidate = 60; // Re-generate at most every 60 seconds (ISR)

export const metadata: Metadata = buildHomepageMetadata();

export default async function Home() {
  // All existing API calls preserved exactly.
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

  const [collectionsData, testimonialsData] = await Promise.all([
    api.getCollections(),
    api.getTestimonials(),
  ]);

  const products = productsData.products || [];
  const collections = (collectionsData.collections || []).slice(0, 2);
  const testimonialsList = testimonialsData.testimonials || [];

  const isAnnouncementEnabled = Boolean(
    homepageSettings.announcement_bar_enabled
  );
  const announcementText = homepageSettings.announcement_bar_text || '';

  // Ticker items for marquee
  const tickerItems = [
    announcementText ||
      'Complimentary worldwide shipping on orders over Rs. 10,000',
    'Handcrafted by Artisans Since 1987',
    '30-Day Returns & Exchanges',
    'Exclusive Artisan Collections',
  ];

  // Stats data, admin-configurable with sensible fallbacks.
  const statsData = [
    {
      num: homepageSettings.stat_customer_rating || '4.9 Star Rating',
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
      num:
        homepageSettings.stat_return_policy &&
        homepageSettings.stat_return_policy !== '30-Day'
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
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(homepageSchema),
        }}
      />
      {/* Reveal observer client component wrapper */}
      <RevealOnScroll>
        <div className="min-h-screen" style={{ background: 'var(--white)' }}>
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
                      fontFamily: 'var(--font-ui)',
                      fontSize: '12px',
                      letterSpacing: '0.05em',
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
          <div className="block md:hidden">
            <CategoryCircles />
          </div>
          <section className="mx-auto max-w-5xl px-6 py-10 text-center md:py-14">
            <h1 className="font-heading text-4xl font-semibold uppercase tracking-[0.02em] text-stone-900 md:text-5xl">
              Handcrafted Indian Ethnic Wear for Women
            </h1>
            <p className="font-body mx-auto mt-4 max-w-3xl text-[15px] font-[300] leading-[1.8] text-stone-600 md:text-lg">
              Discover artisan-made kurtis, shawls, wraps, sarees, and occasion-ready
              silhouettes shaped by premium fabrics, timeless Indian craftsmanship,
              and modern everyday elegance.
            </p>
          </section>
          <TrendingReels />

          <StatsSection statsData={statsData} />

          <CategorySection />

          {/* Marquee strip */}
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
            testimonialsList={testimonialsList}
            collections={collections}
          />

          {/* Divider */}
          <div className="divider-text-prem">
            <span>The Community</span>
          </div>

          <CommunitySection
            communityItems={[
              {
                gradient: 'from-stone-200 to-stone-300',
                user: '@aria.styles',
                caption: 'This pashmina is everything.',
                tag: 'New Arrival',
              },
              {
                gradient: 'from-amber-100 to-amber-200',
                user: '@luxe.by.nina',
                caption: "Wearing the silk kurta to my sister's wedding.",
                tag: 'Wedding Season',
              },
              {
                gradient: 'from-rose-100 to-rose-200',
                user: '@mira.edits',
                caption: 'The quality is unmatched and worth every penny.',
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
                caption: 'Gifted this to my mum and she cried happy tears.',
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

          {/* Marquee strip two */}
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
        </div>
      </RevealOnScroll>
    </>
  );
}
