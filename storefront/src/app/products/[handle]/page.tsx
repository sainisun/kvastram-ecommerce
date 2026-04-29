import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import ProductGrid from '@/components/ProductGrid';
import { RecentlyViewedSection as RecentlyViewed } from '@/components/product/RecentlyViewed';
import ProductView from '@/components/product/ProductView';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  buildProductMetadata,
  getCategoryPath,
  getPrimaryCategory,
  serializeJsonLd,
} from '@/lib/seo';
import type { Product } from '@/types';

type Props = {
  params: Promise<{ handle: string }>;
};

async function getCanonicalProduct(handle: string) {
  const product = await api.getProduct(handle);

  if (!product || !product.id) {
    notFound();
  }

  if (handle !== product.handle) {
    permanentRedirect(`/products/${product.handle}`);
  }

  return product;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;

  try {
    const product = await getCanonicalProduct(handle);
    return buildProductMetadata(product);
  } catch {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getCanonicalProduct(handle).catch(() => notFound());

  const primaryCategory = getPrimaryCategory(product);
  const primaryCategoryPath = primaryCategory
    ? getCategoryPath(primaryCategory)
    : null;
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    primaryCategoryPath && primaryCategory
      ? {
          name: primaryCategory.name,
          path: primaryCategoryPath,
        }
      : { name: 'Products', path: '/products' },
    { name: product.title, path: `/products/${product.handle}` },
  ];

  const jsonLdData = [
    buildProductJsonLd(product),
    buildBreadcrumbJsonLd(breadcrumbItems),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(jsonLdData),
        }}
      />

      <ProductView product={product} />

      <div className="mx-auto max-w-[1440px] border-t border-stone-100 px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <h2 className="font-heading text-[clamp(28px,3vw,44px)] font-normal leading-[1.02] tracking-[-0.03em] text-stone-900">
            You May Also Like
          </h2>
          {primaryCategoryPath && primaryCategory && (
            <a
              href={primaryCategoryPath}
              className="font-body text-[12px] font-medium uppercase tracking-[0.08em] text-amber-700 transition-colors hover:text-stone-900"
            >
              Shop More {primaryCategory.name}
            </a>
          )}
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <RelatedProducts
            categoryIds={product.categories?.map((category) => category.id) || []}
            collectionId={product.collection?.id}
            currentId={product.id}
          />
        </Suspense>
      </div>

      <RecentlyViewed />
    </>
  );
}

async function RelatedProducts({
  categoryIds,
  collectionId,
  currentId,
}: {
  categoryIds: string[];
  collectionId?: string;
  currentId: string;
}) {
  const uniqueCategoryIds = Array.from(new Set(categoryIds)).slice(0, 3);
  const requests: Promise<{ products?: Product[] }>[] = [];

  for (const categoryId of uniqueCategoryIds) {
    requests.push(api.getProducts({ category_id: categoryId, limit: 5 }));
  }

  if (requests.length === 0 && collectionId) {
    requests.push(api.getProducts({ collection_id: collectionId, limit: 5 }));
  } else if (collectionId) {
    requests.push(api.getProducts({ collection_id: collectionId, limit: 5 }));
  }

  if (requests.length === 0) return null;

  const results = await Promise.all(requests);
  const relatedMap = new Map<string, Product>();

  for (const result of results) {
    for (const product of result.products || []) {
      if (product.id === currentId || relatedMap.has(product.id)) continue;
      relatedMap.set(product.id, product);
      if (relatedMap.size >= 4) break;
    }
    if (relatedMap.size >= 4) break;
  }

  const related = Array.from(relatedMap.values()).slice(0, 4);

  if (related.length === 0) return null;

  return <ProductGrid initialProducts={related} />;
}
