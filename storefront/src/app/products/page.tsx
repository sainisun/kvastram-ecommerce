import CatalogClient from '@/components/products/CatalogClient';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function fetchWithTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category_id = params.category_id as string;
  const tag_id = params.tag_id as string;
  const collection_id = params.collection_id as string;
  const sort = params.sort as string;

  let productsData = { products: [], total: 0 };
  let categoriesData = { categories: [] };
  let tagsData = { tags: [] };
  let collectionsData = { collections: [] };

  try {
    // Fetch products with 15 second timeout and bypass cache
    const productsResult = await fetchWithTimeout(
      api.getProducts({ limit: 50, category_id, tag_id, collection_id, sort, cache: false }),
      15000
    );
    productsData = productsResult || { products: [], total: 0 };
    
    // Fetch other data in parallel (with separate error handling)
    const [categoriesResult, tagsResult, collectionsResult] = await Promise.allSettled([
      api.getCategories(),
      api.getTags(),
      api.getCollections()
    ]);
    
    if (categoriesResult.status === 'fulfilled') {
      categoriesData = categoriesResult.value || { categories: [] };
    } else {
      console.warn('[CatalogPage] Failed to fetch categories:', categoriesResult.reason);
    }
    if (tagsResult.status === 'fulfilled') {
      tagsData = tagsResult.value || { tags: [] };
    }
    if (collectionsResult.status === 'fulfilled') {
      collectionsData = collectionsResult.value || { collections: [] };
    }
  } catch (error) {
    // Log error for debugging
  }

  const products = productsData.products || [];
  const categories = categoriesData.categories || [];
  const tags = tagsData.tags || [];
  const collections = collectionsData.collections || [];

  return (
    <CatalogClient
      initialProducts={products}
      categories={categories}
      tags={tags}
      collections={collections}
    />
  );
}
