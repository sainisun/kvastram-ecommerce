import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { storefrontHrefOrNull } from '@/lib/links';
import { cloudinaryUrlOrNull } from '@/lib/media';
import {
  buildBreadcrumbJsonLd,
  buildHomepageMetadata,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
} from '@/lib/seo';
import { CircularCategories } from '@/components/home/CircularCategories';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
import { BrandStory } from '@/components/home/BrandStory';
import { CollectionsSection } from '@/components/home/CollectionsSection';
import { BestSellers } from '@/components/home/BestSellers';
import { ShopTheLook } from '@/components/home/ShopTheLook';
import { WatchBuyPreview } from '@/components/home/WatchBuyPreview';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { NewArrivals } from '@/components/home/NewArrivals';
import { Testimonials } from '@/components/home/Testimonials';
import type { Product } from '@/types';
import type {
  HomepageCategoryCard,
  HomepageCollection,
  HomepageTestimonial,
  HomepageTrendingReel,
  HomepageSpotlightProduct,
} from '@/types/homepage';

type HomepageSettings = {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_cta_text?: string | null;
  hero_cta_link?: string | null;
  hero_image?: string | null;
  newsletter_title?: string | null;
  newsletter_subtitle?: string | null;
  brand_story_title?: string | null;
  brand_story_content?: string | null;
  brand_story_image?: string | null;
  featured_product_ids?: string | null;
};

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
    spotlightsResult,
    newArrivalsResult,
    bestsellersResult,
    heroBannersResult,
  ] = await Promise.allSettled([
    api.getHomepageSettings(),
    api.getProducts({ limit: 8, sort: 'newest' }),
    api.getTestimonials(),
    api.getCollections(),
    api.getTrendingReels(),
    api.getHomepageCategories(),
    api.getSpotlightProducts('spotlight'),
    api.getSpotlightProducts('new_arrivals'),
    api.getSpotlightProducts('bestsellers'),
    api.getHeroBanners(),
  ]);

  const homepageSettings: HomepageSettings =
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
              image: cloudinaryUrlOrNull(item.image),
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
              thumbnail_url?: string | null;
              video_url?: string | null;
            }) =>
              Boolean(
                item?.id &&
                  item?.is_active &&
                  storefrontHrefOrNull(item?.link_url)
              )
          )
          .filter((item: { thumbnail_url?: string | null; video_url?: string | null }) =>
            Boolean(
              cloudinaryUrlOrNull(item.video_url) &&
                cloudinaryUrlOrNull(item.thumbnail_url)
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
              video_url: string;
              thumbnail_url: string;
              product_name: string;
              price: string;
              price_amount?: number | null;
              link_url: string;
              view_count?: number;
              is_active: boolean;
              sort_order: number;
            }) => ({
              id: item.id,
              video_url: cloudinaryUrlOrNull(item.video_url) || '',
              thumbnail_url: cloudinaryUrlOrNull(item.thumbnail_url) || '',
              product_name: item.product_name,
              price: item.price,
              price_amount: item.price_amount ?? null,
              link_url: storefrontHrefOrNull(item.link_url) || '/products',
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
                  storefrontHrefOrNull(item?.link_url) &&
                  item?.name
              )
          )
          .filter((item: { image_url?: string | null }) =>
            Boolean(cloudinaryUrlOrNull(item.image_url))
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
              image_url: cloudinaryUrlOrNull(item.image_url) || '',
              name: item.name,
              link_url: storefrontHrefOrNull(item.link_url) || '/collections',
              is_active: item.is_active,
              sort_order: item.sort_order,
            })
          )
      : [];

  const spotlightProducts: HomepageSpotlightProduct[] =
    spotlightsResult.status === 'fulfilled'
      ? (spotlightsResult.value.featuredProducts || [])
          .filter(
            (item: {
              id?: string;
              product?: { id?: string; title?: string; handle?: string };
            }) => Boolean(item?.id && item?.product?.id && item?.product?.title)
          )
          .slice(0, 3)
          .map(
            (item: {
              id: string;
              badge_text?: string | null;
              custom_image_url?: string | null;
              product: {
                id: string;
                title: string;
                handle?: string;
                thumbnail?: string | null;
                variants?: Array<{
                  prices?: Array<{ amount: number; currency_code: string }>;
                }>;
              };
            }) => ({
              id: item.id,
              badge_text: item.badge_text || null,
              custom_image_url: cloudinaryUrlOrNull(item.custom_image_url),
              product: {
                ...item.product,
                thumbnail: cloudinaryUrlOrNull(item.product.thumbnail),
              },
            })
          )
      : [];

  const newArrivalProducts: Product[] =
    newArrivalsResult.status === 'fulfilled'
      ? (newArrivalsResult.value.featuredProducts || [])
          .map((item: { product?: Product | null }) => item.product)
          .filter((product: Product | null | undefined): product is Product =>
            Boolean(product?.id)
          )
      : [];

  const bestsellerProducts: Product[] =
    bestsellersResult.status === 'fulfilled'
      ? (bestsellersResult.value.featuredProducts || [])
          .map((item: { product?: Product | null }) => item.product)
          .filter((product: Product | null | undefined): product is Product =>
            Boolean(product?.id)
          )
      : [];

  const heroBanners =
    heroBannersResult.status === 'fulfilled'
      ? (heroBannersResult.value.banners || [])
          .filter(
            (item: {
              id?: string;
              is_active?: boolean;
              image_url?: string;
              button_link?: string | null;
            }) =>
              Boolean(
                item?.id &&
                  item?.is_active &&
                  cloudinaryUrlOrNull(item?.image_url) &&
                  (!item.button_link || storefrontHrefOrNull(item.button_link))
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
              title?: string | null;
              subtitle?: string | null;
              button_text?: string | null;
              button_link?: string | null;
            }) => ({
              id: item.id,
              image_url: cloudinaryUrlOrNull(item.image_url) || '',
              title: item.title || null,
              subtitle: item.subtitle || null,
              button_text: item.button_text || null,
              button_link: storefrontHrefOrNull(item.button_link) || '/products',
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

      <CircularCategories />
      <HeroSection banners={heroBanners} />
      <CategoriesGrid categories={homepageCategories} />
      <NewArrivals
        products={newArrivalProducts.length > 0 ? newArrivalProducts : products}
        isCurated={newArrivalProducts.length > 0}
      />
      <CollectionsSection collections={collections} />
      <ShopTheLook spotlightProducts={spotlightProducts} />
      <WatchBuyPreview reels={trendingReels} />
      <BestSellers products={bestsellerProducts} />
      <BrandStory settings={homepageSettings} />
      <Testimonials testimonials={testimonials} />
      <NewsletterSection settings={homepageSettings} />
    </>
  );
}
