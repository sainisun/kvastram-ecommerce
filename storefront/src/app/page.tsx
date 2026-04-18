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
import { CircularCategories } from '@/components/home/CircularCategories';
import { HeroSection } from '@/components/home/HeroSection';
import { TrendingReels } from '@/components/home/TrendingReels';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
import { NewArrivals } from '@/components/home/NewArrivals';
import { Testimonials } from '@/components/home/Testimonials';
import { InstagramReels } from '@/components/home/InstagramReels';
import { BrandStory } from '@/components/home/BrandStory';
import { FabricsSection } from '@/components/home/FabricsSection';
import { CollectionsSection } from '@/components/home/CollectionsSection';
import type { Product } from '@/types';
import type {
  HomepageCategoryCard,
  HomepageCollection,
  HomepageTestimonial,
  HomepageTrendingReel,
} from '@/types/homepage';

export const revalidate = 60;

export const metadata: Metadata = buildHomepageMetadata();

export default async function Home() {
  const [
    homepageResult,
    productsResult,
    testimonialsResult,
    collectionsResult,
    reelsResult,
    categoriesResult,
  ] = await Promise.allSettled([
    api.getHomepageSettings(),
    api.getProducts({ limit: 8, sort: 'newest' }),
    api.getTestimonials(),
    api.getCollections(),
    api.getTrendingReels(),
    api.getHomepageCategories(),
  ]);

  const homepageSettings =
    homepageResult.status === 'fulfilled'
      ? homepageResult.value.settings || {}
      : {};

  const featuredProductIds = homepageSettings.featured_product_ids
    ? homepageSettings.featured_product_ids
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean)
    : [];

  let products: Product[] = [];
  if (featuredProductIds.length > 0) {
    try {
      const featuredResult = await api.getFeaturedProducts(featuredProductIds);
      products = featuredResult.products || [];
    } catch {
      products = [];
    }
  }
  if (products.length === 0 && productsResult.status === 'fulfilled') {
    products = productsResult.value.products || [];
  }

  const testimonials: HomepageTestimonial[] =
    testimonialsResult.status === 'fulfilled'
      ? (testimonialsResult.value.testimonials || [])
          .filter(
            (item: {
              id?: string;
              name?: string;
              content?: string;
            }) => Boolean(item?.id && item?.name && item?.content)
          )
          .map(
            (item: {
              id: string;
              name: string;
              location?: string;
              avatar_url?: string | null;
              rating?: number;
              content: string;
            }) => ({
              id: item.id,
              name: item.name,
              location: item.location,
              avatar_url: item.avatar_url,
              rating: item.rating,
              content: item.content,
            })
          )
      : [];

  const collections: HomepageCollection[] =
    collectionsResult.status === 'fulfilled'
      ? (collectionsResult.value.collections || [])
          .filter(
            (item: { id?: string; title?: string; handle?: string }) =>
              Boolean(item?.id && item?.title && item?.handle)
          )
          .slice(0, 3)
          .map(
            (item: {
              id: string;
              title: string;
              handle: string;
              image?: string | null;
            }) => ({
              id: item.id,
              title: item.title,
              handle: item.handle,
              image: item.image,
            })
          )
      : [];

  const trendingReels: HomepageTrendingReel[] =
    reelsResult.status === 'fulfilled'
      ? (reelsResult.value.reels || [])
          .filter(
            (item: {
              id?: string;
              is_active?: boolean;
              link_url?: string;
            }) => Boolean(item?.id && item?.is_active && item?.link_url)
          )
          .sort(
            (
              a: { sort_order?: number | null },
              b: { sort_order?: number | null }
            ) => (a.sort_order || 0) - (b.sort_order || 0)
          )
          .map(
            (item: {
              id: string;
              video_url: string;
              thumbnail_url: string;
              product_name: string;
              price: string;
              link_url: string;
              view_count?: number;
              is_active: boolean;
              sort_order: number;
            }) => ({
              id: item.id,
              video_url: item.video_url,
              thumbnail_url: item.thumbnail_url,
              product_name: item.product_name,
              price: item.price,
              link_url: item.link_url,
              view_count: item.view_count || 0,
              is_active: item.is_active,
              sort_order: item.sort_order,
            })
          )
      : [];

  const homepageCategories: HomepageCategoryCard[] =
    categoriesResult.status === 'fulfilled'
      ? (categoriesResult.value.categories || [])
          .filter(
            (item: {
              id?: string;
              is_active?: boolean;
              image_url?: string;
              link_url?: string;
              name?: string;
            }) =>
              Boolean(
                item?.id &&
                  item?.is_active &&
                  item?.image_url &&
                  item?.link_url &&
                  item?.name
              )
          )
          .sort(
            (
              a: { sort_order?: number | null },
              b: { sort_order?: number | null }
            ) => (a.sort_order || 0) - (b.sort_order || 0)
          )
          .map(
            (item: {
              id: string;
              image_url: string;
              name: string;
              link_url: string;
              is_active: boolean;
              sort_order: number;
            }) => ({
              id: item.id,
              image_url: item.image_url,
              name: item.name,
              link_url: item.link_url,
              is_active: item.is_active,
              sort_order: item.sort_order,
            })
          )
      : [];

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

      <Suspense fallback={<div className="h-[120px] bg-white" />}>
        <CircularCategories />
      </Suspense>
      <HeroSection />
      <TrendingReels reels={trendingReels} />
      <CategoriesGrid categories={homepageCategories} />
      <NewArrivals
        products={products}
        isCurated={featuredProductIds.length > 0}
      />
      <CollectionsSection collections={collections} />
      <Testimonials testimonials={testimonials} />
      <InstagramReels reels={trendingReels.slice(0, 3)} />
      <BrandStory />
      <FabricsSection />
    </>
  );
}
