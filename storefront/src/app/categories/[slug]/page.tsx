import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ListingHero from '@/components/listing/ListingHero';
import ListingPageClient from '@/components/listing/ListingPageClient';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildCollectionMetadata,
  buildCollectionPageJsonLd,
  findCategoryBySlug,
  serializeJsonLd,
  titleFromHandle,
} from '@/lib/seo';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import type { Product } from '@/types';

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    tag_id?: string;
    min_price?: string;
    max_price?: string;
  }>;
};

type CategoryNode = {
  id: string;
  name?: string;
  slug?: string;
  handle?: string;
  description?: string | null;
  image?: string | null;
  header_image_url?: string | null;
  is_active?: boolean;
  seo_title?: string | null;
  seo_desc?: string | null;
  children?: CategoryNode[];
  parent?: CategoryNode;
};

function siblingLinks(categories: CategoryNode[], activeId: string) {
  return categories
    .filter((category) => category.id !== activeId && category.is_active !== false)
    .slice(0, 6)
    .map((category) => ({
      label: category.name || titleFromHandle(category.slug || category.handle || ''),
      href: `/categories/${category.slug || category.handle}`,
    }))
    .filter((item) => item.href !== '/categories/undefined');
}

async function resolveCategory(slug: string) {
  const categoriesData = await api.getCategories();
  const categories = (categoriesData.categories || []) as CategoryNode[];
  const category = findCategoryBySlug(categories, slug) as CategoryNode | undefined;

  return { category, categories };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await resolveCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = category.name || titleFromHandle(slug);

  return buildCollectionMetadata({
    name: title,
    title: category.seo_title,
    path: `/categories/${category.slug || slug}`,
    description:
      category.seo_desc ||
      category.description ||
      `Shop ${title} at Kvastram, handmade in Jaipur with artisan craft and thoughtful finishing.`,
    image: category.header_image_url || category.image,
    kind: 'category',
    noindex: category.is_active === false,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort, tag_id, min_price, max_price } = await searchParams;
  const { category, categories } = await resolveCategory(slug);

  if (!category || category.is_active === false) {
    notFound();
  }

  const [productsResponse, tagsResponse] = await Promise.all([
    api.getProducts({
      limit: 12,
      sort,
      category_id: category.id,
      tag_id,
      min_price: min_price ? Number(min_price) : undefined,
      max_price: max_price ? Number(max_price) : undefined,
      cache: false,
    }),
    api.getTags(),
  ]);

  const title = category.name || titleFromHandle(slug);
  const products = filterStorefrontReadyProducts(productsResponse.products || []);
  const totalProducts = products.length;
  const children = category.children || [];
  const relatedLinks = [
    ...children
      .filter((child) => child.is_active !== false && (child.slug || child.handle))
      .map((child) => ({
        label: child.name || titleFromHandle(child.slug || child.handle || ''),
        href: `/categories/${child.slug || child.handle}`,
      })),
    ...siblingLinks(categories, category.id),
    { label: 'Shop all products', href: '/products' },
  ].slice(0, 8);

  const schema = [
    buildCollectionPageJsonLd({
      name: title,
      path: `/categories/${category.slug || slug}`,
      description:
        category.description ||
        `Shop ${title} at Kvastram, handmade in Jaipur with artisan craft and thoughtful finishing.`,
      image: category.header_image_url || category.image,
      items: products.map((product: Product) => ({
        name: product.title,
        path: `/products/${product.handle || product.id}`,
      })),
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/products' },
      { name: title, path: `/categories/${category.slug || slug}` },
    ]),
  ];

  return (
    <div className="min-h-screen bg-[var(--ds-surface-paper)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <ListingHero
        eyebrow="Category"
        title={title}
        description={category.description}
        image={category.header_image_url || category.image}
        count={totalProducts}
        variant="category"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/products' },
          { label: title },
        ]}
      />

      {children.length > 0 ? (
        <section className="kv-page-container border-b border-[var(--ds-border-subtle)] py-5">
          <div className="flex flex-wrap gap-3">
            {children
              .filter((child) => child.is_active !== false && (child.slug || child.handle))
              .map((child) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.slug || child.handle}`}
                  className="rounded-full border border-[var(--ds-border-subtle)] px-4 py-2 text-body-sm text-[var(--ds-text-secondary)] transition-colors hover:border-[var(--ds-text-primary)] hover:text-[var(--ds-text-primary)]"
                >
                  {child.name || titleFromHandle(child.slug || child.handle || '')}
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      <ListingPageClient
        basePath={`/categories/${category.slug || slug}`}
        initialProducts={products}
        totalProducts={totalProducts}
        tags={tagsResponse.tags || []}
        fixedParams={{ category_id: category.id }}
        intro={category.description}
        emptyTitle={`No products in ${title} right now.`}
        emptyLinks={relatedLinks}
      />
    </div>
  );
}
