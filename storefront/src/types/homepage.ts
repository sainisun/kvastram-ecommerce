import type { Product } from './index';

export interface HomepageTrendingReel {
  id: string;
  video_url: string;
  thumbnail_url: string;
  product_name: string;
  price: string;
  price_amount: number | null;
  link_url: string;
  view_count: number;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageCategoryCard {
  id: string;
  image_url: string;
  name: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageCategoryCircle {
  id: string;
  label: string;
  link_url: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface HomepageCollection {
  id: string;
  title: string;
  handle: string;
  image?: string | null;
}

export interface HomepageSpotlightProduct {
  id: string;
  badge_text?: string | null;
  custom_image_url?: string | null;
  product: {
    id: string;
    title: string;
    handle?: string;
    thumbnail?: string | null;
    variants?: Array<{
      prices?: Array<{
        amount: number;
        currency_code: string;
      }>;
    }>;
  };
}

export interface HomepageTestimonial {
  id: string;
  name: string;
  location?: string;
  avatar_url?: string | null;
  rating?: number;
  content: string;
}

export interface HomepageMerchandisingSlot {
  id: string;
  slot_key: string;
  eyebrow?: string | null;
  title: string;
  copy?: string | null;
  image_url?: string | null;
  mobile_image_url?: string | null;
  link_url?: string | null;
  linked_product_id?: string | null;
  linked_collection_id?: string | null;
  linked_category_id?: string | null;
  linked_tag_id?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageViewModel {
  products: Product[];
  isCuratedProducts: boolean;
  trendingReels: HomepageTrendingReel[];
  categories: HomepageCategoryCard[];
  collections: HomepageCollection[];
  testimonials: HomepageTestimonial[];
  merchandisingSlots?: HomepageMerchandisingSlot[];
}
