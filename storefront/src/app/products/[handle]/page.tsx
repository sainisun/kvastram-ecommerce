import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import ProductView from '@/components/product/ProductView';
import { RecentlyViewedSection as RecentlyViewed } from '@/components/product/RecentlyViewed';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/types';

type Props = {
  params: Promise<{ handle: string }>;
};

// Helper function to generate JSON-LD structured data (used by both metadata and page)
export function generateProductJsonLd(product: Product, handle: string) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.thumbnail ? [product.thumbnail] : [],
    sku: product.variants?.[0]?.sku,
    brand: {
      '@type': 'Brand',
      name: 'Kvastram',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_STORE_URL}/products/${handle}`,
      priceCurrency:
        product.variants?.[0]?.prices?.[0]?.currency_code?.toUpperCase() ||
        'USD',
      price: (product.variants?.[0]?.prices?.[0]?.amount || 0) / 100,
      availability:
        (product.variants?.[0]?.inventory_quantity || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_STORE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${process.env.NEXT_PUBLIC_STORE_URL}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: `${process.env.NEXT_PUBLIC_STORE_URL}/products/${handle}`,
      },
    ],
  };

  return [jsonLd, breadcrumbJsonLd];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  try {
    const product = await api.getProduct(handle);
    if (!product || !product.title) return { title: 'Product Not Found' };

    const jsonLdData = generateProductJsonLd(product, handle);

    return {
      title: product.seo_title || `${product.title} | Kvastram`,
      description: product.seo_description || product.description,
      openGraph: {
        images: product.thumbnail ? [product.thumbnail] : [],
        title: product.seo_title || `${product.title} | Kvastram`,
        description: product.seo_description || product.description || '',
      },
    };
  } catch (_e) {
    return {
      title: 'Product Not Found',
    };
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  let product: Product | undefined;
  try {
    product = await api.getProduct(handle);
    if (!product || !product.id) notFound();
  } catch (_e) {
    notFound();
  }

  // Generate JSON-LD structured data using helper function
  const jsonLdData = generateProductJsonLd(product!, handle);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdData)
            .replace(/</g, '\\u003C')
            .replace(/>/g, '\\u003E'),
        }}
      />

      <ProductView product={product!} />

      {/* Related Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-stone-100">
        <h2 className="text-2xl font-serif text-stone-900 mb-8 text-center">
          You May Also Like
        </h2>
        <Suspense fallback={<div>Loading...</div>}>
          <RelatedProducts
            categoryIds={product.categories?.map((c) => c.id) || []}
            currentId={product.id}
          />
        </Suspense>
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed />
    </>
  );
}

async function RelatedProducts({
  categoryIds,
  currentId,
}: {
  categoryIds: string[];
  currentId: string;
}) {
  if (categoryIds.length === 0) return null;

  // Fetch related products based on first category for now
  // In future, can improve algorithm
  const data = await api.getProducts({
    category_id: categoryIds[0],
    limit: 5, // Fetch 5 to have buffer if we filter one out, though backend pagination might return exact limit
  });

  const related = (data.products || [])
    .filter((p: Product) => p.id !== currentId)
    .slice(0, 4);

  if (related.length === 0) return null;

  return <ProductGrid initialProducts={related} />;
}
