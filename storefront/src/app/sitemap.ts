import { MetadataRoute } from 'next';
import { api } from '@/lib/api';

// Define interfaces for sitemap entries
interface SitemapProduct {
  id: string;
  handle: string;
  updated_at?: string;
}

interface SitemapPost {
  id: string;
  slug: string;
  updated_at?: string;
  published_at?: string;
}

interface SitemapPage {
  id: string;
  slug: string;
  updated_at?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://kvastram.com';

  const [productsRes, postsRes, pagesRes] = await Promise.all([
    api.getProducts().catch(() => ({ products: [] })),
    api.getPosts().catch(() => ({ posts: [] })),
    api.getPages().catch(() => ({ pages: [] })),
  ]);

  const products: SitemapProduct[] = productsRes.products || [];
  const posts: SitemapPost[] = postsRes.posts || [];

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/products/${product.handle}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/journal/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productUrls,
    ...postUrls,
  ];
}
