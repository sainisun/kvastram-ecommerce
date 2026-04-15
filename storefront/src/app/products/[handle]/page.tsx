import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
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

      <div className="mx-auto max-w-7xl border-t border-stone-100 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <h2 className="font-body text-3xl font-semibold uppercase tracking-[0.02em] text-stone-900">
            You May Also Like
          </h2>
          {primaryCategoryPath && primaryCategory && (
            <Link
              href={primaryCategoryPath}
              className="font-body text-[12px] font-medium uppercase tracking-[0.08em] text-amber-700 transition-colors hover:text-stone-900"
            >
              Shop More {primaryCategory.name}
            </Link>
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
  const params =
    categoryIds.length > 0
      ? { category_id: categoryIds[0], limit: 5 }
      : collectionId
        ? { collection_id: collectionId, limit: 5 }
        : null;

  if (!params) return null;

  const data = await api.getProducts(params);
  const related = (data.products || [])
    .filter((product: Product) => product.id !== currentId)
    .slice(0, 4);

  if (related.length === 0) return null;

  return <ProductGrid initialProducts={related} />;
}
