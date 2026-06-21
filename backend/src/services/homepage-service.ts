import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../db/client';
import {
  category_circles,
  collection_products,
  hero_banners,
  homepage_categories,
  homepage_social_posts,
  line_items,
  orders,
  product_collections,
  product_variants,
  products,
  settings,
  trending_reels,
} from '../db/schema';
import { productService } from './product-service';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

export type HomepageSectionStatus = {
  status: 'ready' | 'empty' | 'error';
  count: number;
};

type HomepageSectionKey =
  | 'categoryCircles'
  | 'hero'
  | 'featuredCategories'
  | 'bestSellers'
  | 'collections'
  | 'watchShop'
  | 'brandStory'
  | 'social'
  | 'newsletter';

export type HomepageSectionStatuses = Record<HomepageSectionKey, HomepageSectionStatus>;

const CAPTURED_PAYMENT_STATUS = 'captured';
const CANCELED_ORDER_STATUS = 'canceled';

export function isQualifyingBestSellerOrder(order: {
  payment_status: string | null;
  status: string | null;
}) {
  return (
    order.payment_status === CAPTURED_PAYMENT_STATUS &&
    order.status !== CANCELED_ORDER_STATUS
  );
}

export function compareBestSellerRows(
  left: { product_id: string; units_sold: number; latest_sale_at: Date },
  right: { product_id: string; units_sold: number; latest_sale_at: Date }
) {
  return (
    right.units_sold - left.units_sold ||
    right.latest_sale_at.getTime() - left.latest_sale_at.getTime() ||
    left.product_id.localeCompare(right.product_id)
  );
}

function statusFor(items: unknown[]): HomepageSectionStatus {
  return { status: items.length > 0 ? 'ready' : 'empty', count: items.length };
}

export function dedupeCampaignProductIds(
  productIds: string[],
  bestSellerIds: ReadonlySet<string>,
  limit = 3
) {
  return Array.from(new Set(productIds))
    .filter((id) => !bestSellerIds.has(id))
    .slice(0, limit);
}

function settingValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const PLACEHOLDER_TITLE =
  /\b(test|testing|dummy|demo|sample|placeholder|lorem|hhj|asdf|abc|untitled)\b/i;

function isHomepageProductReady(product: any) {
  const image =
    product?.thumbnail ||
    product?.images?.find((item: { url?: string }) => isCloudinaryUrl(item?.url))?.url;
  const hasPrice = product?.variants?.some((variant: any) =>
    variant?.prices?.some(
      (price: any) => Number.isFinite(price?.amount) && price.amount > 0
    )
  );
  return Boolean(
    product?.id &&
      product?.status === 'published' &&
      product?.title?.trim() &&
      !PLACEHOLDER_TITLE.test(product.title) &&
      isCloudinaryUrl(image) &&
      hasPrice
  );
}

async function loadBestSellers(limit = 4) {
  const rows = await db
    .select({
      product_id: products.id,
      units_sold: sql<number>`sum(${line_items.quantity})::int`,
      latest_sale_at: sql<Date>`max(${orders.created_at})`,
    })
    .from(line_items)
    .innerJoin(orders, eq(line_items.order_id, orders.id))
    .innerJoin(product_variants, eq(line_items.variant_id, product_variants.id))
    .innerJoin(products, eq(product_variants.product_id, products.id))
    .where(
      and(
        eq(orders.payment_status, CAPTURED_PAYMENT_STATUS),
        ne(orders.status, CANCELED_ORDER_STATUS),
        eq(products.status, 'published'),
        eq(products.is_wholesale_only, false)
      )
    )
    .groupBy(products.id)
    .orderBy(
      desc(sql`sum(${line_items.quantity})`),
      desc(sql`max(${orders.created_at})`),
      asc(products.id)
    )
    .limit(limit);

  const enriched = await productService.retrieveMany(rows.map((row) => row.product_id));
  const byId = new Map(
    enriched.filter(isHomepageProductReady).map((product) => [product.id, product])
  );

  return rows
    .map((row) => {
      const product = byId.get(row.product_id);
      return product ? { ...product, units_sold: Number(row.units_sold || 0) } : null;
    })
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
}

async function loadCollections(bestSellerIds: ReadonlySet<string>) {
  const now = new Date();
  const collections = await db
    .select()
    .from(product_collections)
    .where(
      and(
        eq(product_collections.status, 'active'),
        eq(product_collections.rule_type, 'manual'),
        eq(product_collections.homepage_section, 'collections'),
        isNull(product_collections.deleted_at),
        or(isNull(product_collections.valid_from), sql`${product_collections.valid_from} <= ${now}`),
        or(isNull(product_collections.valid_until), sql`${product_collections.valid_until} >= ${now}`)
      )
    )
    .orderBy(asc(product_collections.display_order), desc(product_collections.created_at))
    .limit(6);

  const collectionIds = collections.map((collection) => collection.id);
  if (collectionIds.length === 0) return [];

  const assignments = await db
    .select({
      collection_id: collection_products.collection_id,
      product_id: collection_products.product_id,
      position: collection_products.position,
    })
    .from(collection_products)
    .innerJoin(products, eq(collection_products.product_id, products.id))
    .where(
      and(
        inArray(collection_products.collection_id, collectionIds),
        eq(products.status, 'published'),
        eq(products.is_wholesale_only, false)
      )
    )
    .orderBy(asc(collection_products.collection_id), asc(collection_products.position));

  const previewIdsByCollection = new Map<string, string[]>();
  for (const assignment of assignments) {
    const current = previewIdsByCollection.get(assignment.collection_id) || [];
    current.push(assignment.product_id);
    previewIdsByCollection.set(assignment.collection_id, current);
  }

  const previewIds = Array.from(
    new Set(
      collections.flatMap((collection) =>
        dedupeCampaignProductIds(
          previewIdsByCollection.get(collection.id) || [],
          bestSellerIds
        )
      )
    )
  );
  const previewProducts = await productService.retrieveMany(previewIds);
  const productById = new Map(
    previewProducts.filter(isHomepageProductReady).map((product) => [product.id, product])
  );

  return collections
    .filter((collection) => isCloudinaryUrl(collection.cover_image_url || collection.image))
    .map((collection) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      description: collection.description,
      image: collection.cover_image_url || collection.image,
      products: dedupeCampaignProductIds(
        previewIdsByCollection.get(collection.id) || [],
        bestSellerIds
      )
        .map((id) => productById.get(id))
        .filter((product): product is NonNullable<typeof product> => Boolean(product)),
    }))
    .filter((collection) => collection.products.length > 0);
}

async function loadWatchShop() {
  const reels = await db
    .select()
    .from(trending_reels)
    .where(eq(trending_reels.is_active, true))
    .orderBy(asc(trending_reels.sort_order), asc(trending_reels.created_at))
    .limit(6);
  const validReels = reels.filter(
    (reel) =>
      reel.product_id &&
      isCloudinaryUrl(reel.video_url) &&
      isCloudinaryUrl(reel.thumbnail_url)
  );
  const productsForReels = await productService.retrieveMany(
    validReels.map((reel) => reel.product_id as string)
  );
  const productById = new Map(
    productsForReels.filter(isHomepageProductReady).map((product) => [product.id, product])
  );

  return validReels
    .map((reel) => {
      const product = productById.get(reel.product_id as string);
      if (!product || product.status !== 'published') return null;
      return {
        id: reel.id,
        video_url: reel.video_url,
        thumbnail_url: reel.thumbnail_url,
        caption: reel.caption,
        sort_order: reel.sort_order,
        product,
      };
    })
    .filter((reel): reel is NonNullable<typeof reel> => Boolean(reel));
}

export class HomepageService {
  async getHomepage() {
    const statuses = {} as HomepageSectionStatuses;

    const [circlesResult, heroResult, categoriesResult, settingsResult, socialResult] =
      await Promise.allSettled([
        db
          .select()
          .from(category_circles)
          .where(eq(category_circles.is_active, true))
          .orderBy(asc(category_circles.sort_order), asc(category_circles.created_at))
          .limit(10),
        db
          .select()
          .from(hero_banners)
          .where(eq(hero_banners.is_active, true))
          .orderBy(asc(hero_banners.sort_order), asc(hero_banners.created_at))
          .limit(4),
        db
          .select()
          .from(homepage_categories)
          .where(eq(homepage_categories.is_active, true))
          .orderBy(asc(homepage_categories.sort_order), asc(homepage_categories.created_at))
          .limit(4),
        db.select().from(settings).where(eq(settings.category, 'homepage')),
        db
          .select()
          .from(homepage_social_posts)
          .where(eq(homepage_social_posts.is_active, true))
          .orderBy(
            asc(homepage_social_posts.sort_order),
            asc(homepage_social_posts.created_at)
          )
          .limit(8),
      ]);

    const categoryCircles =
      circlesResult.status === 'fulfilled'
        ? circlesResult.value.filter(
            (item) => isCloudinaryUrl(item.image_url) && isStorefrontHref(item.link_url)
          )
        : [];
    statuses.categoryCircles =
      circlesResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : statusFor(categoryCircles);

    const hero =
      heroResult.status === 'fulfilled'
        ? heroResult.value.filter(
            (item) =>
              isCloudinaryUrl(item.image_url) &&
              Boolean(item.title?.trim() && item.button_text?.trim()) &&
              isStorefrontHref(item.button_link)
          ).map((item) => ({
            ...item,
            mobile_image_url: isCloudinaryUrl(item.mobile_image_url)
              ? item.mobile_image_url
              : null,
          }))
        : [];
    statuses.hero =
      heroResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : { status: hero.length === 4 ? 'ready' : 'empty', count: hero.length };

    const featuredCategories =
      categoriesResult.status === 'fulfilled'
        ? categoriesResult.value.filter(
            (item) => isCloudinaryUrl(item.image_url) && isStorefrontHref(item.link_url)
          )
        : [];
    statuses.featuredCategories =
      categoriesResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : {
            status: featuredCategories.length === 4 ? 'ready' : 'empty',
            count: featuredCategories.length,
          };

    let bestSellers: Awaited<ReturnType<typeof loadBestSellers>> = [];
    try {
      bestSellers = await loadBestSellers();
      statuses.bestSellers = statusFor(bestSellers);
    } catch (error) {
      console.error('[Homepage] best sellers failed:', error);
      statuses.bestSellers = { status: 'error', count: 0 };
    }

    let collections: Awaited<ReturnType<typeof loadCollections>> = [];
    try {
      collections = await loadCollections(new Set(bestSellers.map((product) => product.id)));
      statuses.collections = statusFor(collections);
    } catch (error) {
      console.error('[Homepage] collections failed:', error);
      statuses.collections = { status: 'error', count: 0 };
    }

    let watchShop: Awaited<ReturnType<typeof loadWatchShop>> = [];
    try {
      watchShop = await loadWatchShop();
      statuses.watchShop = statusFor(watchShop);
    } catch (error) {
      console.error('[Homepage] watch shop failed:', error);
      statuses.watchShop = { status: 'error', count: 0 };
    }

    const settingsMap =
      settingsResult.status === 'fulfilled'
        ? Object.fromEntries(settingsResult.value.map((item) => [item.key, item.value]))
        : {};

    const brandStoryImage = settingValue(settingsMap.brand_story_image);
    const brandStoryTitle = settingValue(settingsMap.brand_story_title);
    const brandStoryContent = settingValue(settingsMap.brand_story_content);
    const brandStory =
      brandStoryImage &&
      isCloudinaryUrl(brandStoryImage) &&
      brandStoryTitle &&
      brandStoryContent
        ? {
            title: brandStoryTitle,
            content: brandStoryContent,
            image_url: brandStoryImage,
          }
        : null;
    statuses.brandStory =
      settingsResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : statusFor(brandStory ? [brandStory] : []);

    const newsletterSubtitle = settingValue(settingsMap.newsletter_subtitle);
    const newsletter = newsletterSubtitle
      ? {
          title:
            settingValue(settingsMap.newsletter_title) || 'Join The Kvastram Circle',
          subtitle: newsletterSubtitle,
        }
      : null;
    statuses.newsletter =
      settingsResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : statusFor(newsletter ? [newsletter] : []);

    const social =
      socialResult.status === 'fulfilled'
        ? socialResult.value.filter(
            (item) =>
              isCloudinaryUrl(item.image_url) &&
              isStorefrontHref(item.destination_url)
          )
        : [];
    statuses.social =
      socialResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : statusFor(social);

    return {
      generated_at: new Date().toISOString(),
      status: statuses,
      category_circles: categoryCircles,
      hero,
      featured_categories: featuredCategories,
      best_sellers: bestSellers,
      collections,
      watch_shop: watchShop,
      brand_story: brandStory,
      social,
      newsletter,
    };
  }
}

export const homepageService = new HomepageService();
