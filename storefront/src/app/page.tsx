import type { Metadata } from 'next';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildHomepageMetadata,
  serializeJsonLd,
} from '@/lib/seo';
import { CircularCategories } from '@/components/home/CircularCategories';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { BestSellers } from '@/components/home/BestSellers';
import { NewArrivals } from '@/components/home/NewArrivals';
import { WatchBuyPreview } from '@/components/home/WatchBuyPreview';
import { CraftJourneySection } from '@/components/home/CraftJourneySection';
import { EditorialDiscovery } from '@/components/home/EditorialDiscovery';
import { HomepageFallback } from '@/components/home/HomepageFallback';
import { Heading } from '@/design-system';
import type { HomepagePayload } from '@/types/homepage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildHomepageMetadata();

const EMPTY_HOMEPAGE: HomepagePayload = {
  generated_at: '',
  status: {
    categoryCircles: { status: 'error', count: 0 },
    hero: { status: 'error', count: 0 },
    featuredCategories: { status: 'error', count: 0 },
    bestSellers: { status: 'error', count: 0 },
    newArrivals: { status: 'error', count: 0 },
    collectionSlider: { status: 'error', count: 0 },
    collections: { status: 'error', count: 0 },
    watchShop: { status: 'error', count: 0 },
    brandStory: { status: 'error', count: 0 },
    social: { status: 'error', count: 0 },
    newsletter: { status: 'error', count: 0 },
  },
  category_circles: [],
  hero: [],
  featured_categories: [],
  best_sellers: [],
  new_arrivals: [],
  collection_slider: [],
  collections: [],
  watch_shop: [],
  brand_story: null,
  social: [],
  newsletter: null,
};

export default async function Home() {
  let homepage = EMPTY_HOMEPAGE;
  let testimonialsResponse = { testimonials: [] };
  let homepageLoaded = false;

  try {
    const [hp, test] = await Promise.all([
      api.getHomepage(),
      api.getTestimonials()
    ]);
    homepage = hp;
      testimonialsResponse = test;
      homepageLoaded = true;
  } catch (error) {
    console.error('[Homepage] unable to load aggregate payload:', error);
  }

  const homepageSchema = [buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }])];

  return (
    <div className="bg-surface-page text-primary" data-homepage-generated-at={homepage.generated_at || undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homepageSchema) }}
      />
      <Heading role="page" className="sr-only">Odhvica storefront</Heading>
      
      {homepageLoaded ? (
        <>
          {/* S1. Circle Category Strip */}
          <CircularCategories circles={homepage.category_circles} />
        </>
      ) : (
        <HomepageFallback />
      )}
      
      {homepageLoaded ? (
        <>
          {/* S2. Hero Section */}
          <HeroSection
            banners={homepage.hero}
            testimonial={testimonialsResponse.testimonials?.[0]}
          />

          {/* S3. Trust Bar */}
          <HomeTrustBar />

          {/* S4. Best Sellers */}
          <BestSellers products={homepage.best_sellers} state={homepage.status.bestSellers.status} />

          {/* S5. New Arrivals */}
          <NewArrivals products={homepage.new_arrivals} />

          {/* S5b. Editorial discovery driven by live category and collection payloads */}
          <EditorialDiscovery
            categories={homepage.featured_categories}
            collections={homepage.collections}
          />

          {/* S6. Watch & Buy */}
          <WatchBuyPreview reels={homepage.watch_shop} />

          {/* S7. Our Craft Journey */}
          <CraftJourneySection story={homepage.brand_story} />
        </>
      ) : null}
    </div>
  );
}
