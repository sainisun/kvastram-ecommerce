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
import { EditorialCategoryGrid } from '@/components/home/EditorialCategoryGrid';
import { BestSellers } from '@/components/home/BestSellers';
import { ShoppingHelpStrip } from '@/components/home/ShoppingHelpStrip';
import { CuratedEditsSection } from '@/components/home/HomeMerchandisingSections';
import { NewArrivals } from '@/components/home/NewArrivals';
import { WatchBuyPreview } from '@/components/home/WatchBuyPreview';
import { CollectionSlider } from '@/components/home/CollectionSlider';
import { CraftJourneySection } from '@/components/home/CraftJourneySection';
import { StatsSection } from '@/components/home/StatsSection';
import { Testimonials } from '@/components/home/Testimonials';
import { InstagramSection } from '@/components/home/InstagramSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { MobileStickyActions } from '@/components/home/MobileStickyActions';
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

  const statsData = [
    { num: '30k+', label: 'Happy Customers' },
    { num: '4.9', label: 'Average Rating' },
    { num: '100%', label: 'Handmade' },
    { num: '14', label: 'Days Return' },
  ];

  return (
    <div className="bg-surface-page text-primary" data-homepage-generated-at={homepage.generated_at || undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homepageSchema) }}
      />
      <Heading role="page" className="sr-only">Odhvica storefront</Heading>
      
      {/* S1. Circle Category Strip */}
      <CircularCategories circles={homepage.category_circles} />
      
      {/* S2. Hero Section */}
      <HeroSection
        banners={homepage.hero}
        testimonial={testimonialsResponse.testimonials?.[0]}
      />
      
      {/* S3. Trust Bar */}
      <HomeTrustBar />

      {/* S4. Editorial Category Grid */}
      <EditorialCategoryGrid categories={homepage.featured_categories} />

      {/* S5. Best Sellers */}
      <BestSellers products={homepage.best_sellers} state={homepage.status.bestSellers.status} />

      {/* S6. Shopping Help Strip */}
      <ShoppingHelpStrip />

      {/* S7. Curated Edits (Unified Merchandising) */}
      <CuratedEditsSection merchandisingSlots={merchandisingResponse.slots || []} />

      {/* S8. New Arrivals */}
      <NewArrivals products={homepage.new_arrivals} />

      {/* S9. Customer Love */}
      <Testimonials testimonials={testimonialsResponse.testimonials || []} />
      
      {/* S10. Our Craft Journey */}
      <CraftJourneySection story={homepage.brand_story} />

      {/* S11. Stats Counter */}
      <StatsSection statsData={statsData} />

      {/* S12. Watch & Buy */}
      <WatchBuyPreview reels={homepage.watch_shop} />

      {/* S13. Collection discovery (preserved existing feature) */}
      <CollectionSlider collections={homepage.collection_slider} />

      {/* S14. Join the Circle (Newsletter + Social Feed) */}
      <section className="bg-surface-paper border-t border-border-subtle" data-home-section="14-join-circle">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
          <InstagramSection posts={homepage.social} isCompact />
          <NewsletterSection settings={homepage.newsletter} isCompact />
        </div>
      </section>

      <MobileStickyActions />
    </div>
  );
}
