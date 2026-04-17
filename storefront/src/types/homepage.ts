import type { Product } from './index';

export interface HomepageTrendingReel {
  id: string;
  video_url: string;
  thumbnail_url: string;
  product_name: string;
  price: string;
  link_url: string;
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

export interface HomepageCollection {
  id: string;
  title: string;
  handle: string;
  image?: string | null;
}

export interface HomepageTestimonial {
  id: string;
  name: string;
  location?: string;
  avatar_url?: string | null;
  rating?: number;
  content: string;
}

export interface HomepageViewModel {
  products: Product[];
  isCuratedProducts: boolean;
  trendingReels: HomepageTrendingReel[];
  categories: HomepageCategoryCard[];
  collections: HomepageCollection[];
  testimonials: HomepageTestimonial[];
}
