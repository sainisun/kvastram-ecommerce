import CatalogClient from '@/components/products/CatalogClient';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

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
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    );
    
    const productsPromise = api.getProducts({
      limit: 50,
      category_id,
      tag_id,
      collection_id,
      sort,
    });
    
    const categoriesPromise = api.getCategories();
    const tagsPromise = api.getTags();
    const collectionsPromise = api.getCollections();

    const results = await Promise.race([
      Promise.all([productsPromise, categoriesPromise, tagsPromise, collectionsPromise]),
      timeout
    ]) as any[];

    [productsData, categoriesData, tagsData, collectionsData] = results;
  } catch (error) {
    console.error('[CatalogPage] Error fetching data:', error);
    // Continue with empty data
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
