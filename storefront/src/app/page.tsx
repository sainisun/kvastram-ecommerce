import type { Metadata } from 'next';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildHomepageMetadata,
  serializeJsonLd,
} from '@/lib/seo';
import { CircularCategories } from '@/components/home/CircularCategories';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryCarousel } from '@/components/home/CategoryCarousel';
import { CollectionSlider } from '@/components/home/CollectionSlider';
import { BestSellers } from '@/components/home/BestSellers';
import { NewArrivals } from '@/components/home/NewArrivals';
import { WatchBuyPreview } from '@/components/home/WatchBuyPreview';
import { InstagramSection } from '@/components/home/InstagramSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { HomeMerchandisingSection } from '@/components/home/HomeMerchandisingSections';
import { Testimonials } from '@/components/home/Testimonials';
import { ShoppingHelpStrip } from '@/components/home/ShoppingHelpStrip';
import { CraftJourneySection } from '@/components/home/CraftJourneySection';
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
  let merchandisingResponse = { slots: [] };

  try {
    const [hp, test, merch] = await Promise.all([
      api.getHomepage(),
      api.getTestimonials(),
      api.getHomepageMerchandising()
    ]);
    homepage = hp;
    testimonialsResponse = test;
    merchandisingResponse = merch;
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
      
      {/* 1. Circle Category Strip */}
      <CircularCategories circles={homepage.category_circles} />
      
      {/* 2. Hero Section */}
      <HeroSection banners={homepage.hero} />
      
      {/* 3. Category Carousel / Shop by Need */}
      <CategoryCarousel categories={homepage.featured_categories} />

      {/* 4. New Arrivals Product Carousel */}
      <NewArrivals products={homepage.new_arrivals} />
      
      {/* 5. Limited Editions (Seasonal Edits) */}
      <HomeMerchandisingSection merchandisingSlots={merchandisingResponse.slots || []} slotKey="seasonal_edits" />

      {/* 6. Shopping Help Strip */}
      <ShoppingHelpStrip />

      {/* 7. Collection Slider */}
      <CollectionSlider collections={homepage.collection_slider} />
      
      {/* 8. Craft & Material (Fabric Edits) */}
      <HomeMerchandisingSection merchandisingSlots={merchandisingResponse.slots || []} slotKey="fabric_edits" />
      
      {/* 9. Our Craft Journey (Merges Brand Story + Craft Promise) */}
      <CraftJourneySection story={homepage.brand_story} />
      
      {/* 10. Watch & Buy / Trending Now Section */}
      <WatchBuyPreview reels={homepage.watch_shop} />
      
      {/* 11. Chosen For You / Best Seller Product Slider */}
      <BestSellers products={homepage.best_sellers} state={homepage.status.bestSellers.status} />

      {/* 12. Dress for the Moment (Occasion Edits) */}
      <HomeMerchandisingSection merchandisingSlots={merchandisingResponse.slots || []} slotKey="occasion_edits" />

      {/* 13. Customer Love (Testimonials) */}
      <Testimonials testimonials={testimonialsResponse.testimonials || []} />

      {/* 14. Join the Circle (Newsletter + Social Feed side-by-side) */}
      <section className="bg-surface-paper border-t border-border-subtle" data-home-section="14-join-circle">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
          <InstagramSection posts={homepage.social} isCompact />
          <NewsletterSection settings={homepage.newsletter} />
        </div>
      </section>
    </div>
  );
}
