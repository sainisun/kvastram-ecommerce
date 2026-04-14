import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import CatalogClient from '@/components/products/CatalogClient';
import { api } from '@/lib/api';
import { buildCatalogMetadata, findCategoryById } from '@/lib/seo';
import type { Product } from '@/types';

export const revalidate = 60;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export const metadata: Metadata = buildCatalogMetadata();

async function fetchWithTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Request timeout after ${ms}ms`)),
      ms
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function appendSort(handle: string, sort?: string) {
  if (!sort || sort === 'newest') return handle;
  return `${handle}?sort=${encodeURIComponent(sort)}`;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const categoryId = params.category_id as string | undefined;
  const tagId = params.tag_id as string | undefined;
  const collectionId = params.collection_id as string | undefined;
  const sort = params.sort as string | undefined;

  if (categoryId || collectionId) {
    const [categoriesResult, collectionsResult] = await Promise.all([
      api.getCategories(),
      api.getCollections(),
    ]);

    if (categoryId) {
      const category = findCategoryById(
        categoriesResult.categories || [],
        categoryId
      );

      if (category?.slug || category?.handle) {
        permanentRedirect(
          appendSort(
            `/collections/${category.slug || category.handle}`,
            sort
          )
        );
      }
    }

    if (collectionId) {
      const collection = (collectionsResult.collections || []).find(
        (item: { id: string; handle?: string }) => item.id === collectionId
      );

      if (collection?.handle) {
        permanentRedirect(
          appendSort(`/collections/${collection.handle}`, sort)
        );
      }
    }
  }

  let productsData: {
    products: Product[];
    total: number;
    limit?: number;
    offset?: number;
  } = { products: [], total: 0 };
  let categoriesData = { categories: [] };
  let tagsData = { tags: [] };
  let collectionsData = { collections: [] };

  try {
    const productsResult = await fetchWithTimeout(
      api.getProducts({
        limit: 50,
        tag_id: tagId,
        sort,
        cache: false,
      }),
      15000
    );
    productsData = productsResult || { products: [], total: 0 };

    const [categoriesResult, tagsResult, collectionsResult] =
      await Promise.allSettled([
        api.getCategories(),
        api.getTags(),
        api.getCollections(),
      ]);

    if (categoriesResult.status === 'fulfilled') {
      categoriesData = categoriesResult.value || { categories: [] };
    }

    if (tagsResult.status === 'fulfilled') {
      tagsData = tagsResult.value || { tags: [] };
    }

    if (collectionsResult.status === 'fulfilled') {
      collectionsData = collectionsResult.value || { collections: [] };
    }
  } catch {
    // Keep resilient empty fallbacks for the catalog page.
  }

  return (
    <CatalogClient
      initialProducts={productsData.products || []}
      categories={categoriesData.categories || []}
      tags={tagsData.tags || []}
      collections={collectionsData.collections || []}
      totalProducts={productsData.total || 0}
    />
  );
}
