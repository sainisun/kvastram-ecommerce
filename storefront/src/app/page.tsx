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
import { CollectionsSection } from '@/components/home/CollectionsSection';
import { WatchBuyPreview } from '@/components/home/WatchBuyPreview';
import { BrandStory } from '@/components/home/BrandStory';
import { InstagramSection } from '@/components/home/InstagramSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
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
  collection_slider: [],
  collections: [],
  watch_shop: [],
  brand_story: null,
  social: [],
  newsletter: null,
};

export default async function Home() {
  let homepage = EMPTY_HOMEPAGE;
  try {
    homepage = await api.getHomepage();
  } catch (error) {
    console.error('[Homepage] unable to load aggregate payload:', error);
  }

  const homepageSchema = [buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }])];

  return (
    <div className="homepage-shell" data-homepage-generated-at={homepage.generated_at || undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homepageSchema) }}
      />
      {/* 1. Circle Category Strip */}
      <CircularCategories circles={homepage.category_circles} />
      
      {/* 2. Hero Section */}
      <HeroSection banners={homepage.hero} />
      
      {/* 3. Category Carousel */}
      <CategoryCarousel categories={homepage.featured_categories} />

      {/* 4. Collection Slider */}
      <CollectionSlider collections={homepage.collection_slider} />
      
      {/* 5. Chosen For You / Best Seller Product Slider */}
      <BestSellers products={homepage.best_sellers} state={homepage.status.bestSellers.status} />

      {/* 6. Editorial Collection / Campaign Section */}
      <CollectionsSection collections={homepage.collections} />
      
      {/* 7. Watch & Buy / Trending Now Section */}
      <WatchBuyPreview reels={homepage.watch_shop} />
      
      {/* 8. Brand Story Section */}
      <BrandStory story={homepage.brand_story} />
      
      {/* 9. Instagram / Social Feed Section */}
      <InstagramSection posts={homepage.social} />
      
      {/* 10. Newsletter Section */}
      <NewsletterSection settings={homepage.newsletter} />
    </div>
  );
}
