import { MetadataRoute } from 'next';

import { api } from '@/lib/api';
import { flattenCategories, SITE_URL } from '@/lib/seo';
import type { Product } from '@/types';

async function fetchAllProducts() {
  const limit = 100;
  let offset = 0;
  let total = 0;
  const products: Product[] = [];

  do {
    const response = await api.getProducts({ limit, offset });
    products.push(...(response.products || []));
    total = response.total || products.length;
    offset += limit;
  } while (offset < total);

  return products;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/bestsellers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/reels`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/journal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [products, categoriesData, collectionsData, pagesData, postsData] =
      await Promise.all([
        fetchAllProducts(),
        api.getCategories(),
        api.getCollections(),
        api.getPages(),
        api.getPosts(),
      ]);

    const categoryEntries = flattenCategories(categoriesData.categories || [])
      .filter((category) => category.slug || category.handle)
      .map((category) => ({
        url: `${SITE_URL}/collections/${category.slug || category.handle}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    const collectionEntries = (collectionsData.collections || [])
      .filter((collection: { handle?: string }) => collection.handle)
      .map((collection: { handle: string; updated_at?: string }) => ({
        url: `${SITE_URL}/collections/${collection.handle}`,
        lastModified: collection.updated_at
          ? new Date(collection.updated_at)
          : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    const productEntries = products.map((product) => ({
      url: `${SITE_URL}/products/${product.handle}`,
      lastModified: product.created_at ? new Date(product.created_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    const pageEntries = (pagesData.pages || [])
      .filter((page: { slug?: string; is_visible?: boolean }) => page.slug && page.is_visible)
      .map((page: { slug: string; updated_at?: string }) => ({
        url: `${SITE_URL}/pages/${page.slug}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }));

    const postEntries = (postsData.posts || [])
      .filter((post: { slug?: string }) => post.slug)
      .map((post: { slug: string; updated_at?: string; published_at?: string }) => ({
        url: `${SITE_URL}/journal/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));

    const uniqueEntries = new Map<string, MetadataRoute.Sitemap[number]>();
    [
      ...baseEntries,
      ...categoryEntries,
      ...collectionEntries,
      ...productEntries,
      ...pageEntries,
      ...postEntries,
    ].forEach((entry) => {
      uniqueEntries.set(entry.url, entry);
    });

    return Array.from(uniqueEntries.values());
  } catch {
    return baseEntries;
  }
}
