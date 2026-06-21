import type { Metadata } from 'next';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildHomepageMetadata,
  serializeJsonLd,
} from '@/lib/seo';
import { CircularCategories } from '@/components/home/CircularCategories';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
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
      <CircularCategories circles={homepage.category_circles} />
      <HeroSection banners={homepage.hero} />
      <CategoriesGrid categories={homepage.featured_categories} />
      <BestSellers products={homepage.best_sellers} state={homepage.status.bestSellers.status} />
      <CollectionsSection collections={homepage.collections} />
      <WatchBuyPreview reels={homepage.watch_shop} />
      <BrandStory story={homepage.brand_story} />
      <InstagramSection posts={homepage.social} />
      <NewsletterSection settings={homepage.newsletter} />
    </div>
  );
}
