import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect, redirect } from 'next/navigation';

import PageHero from '@/components/hero/PageHero';
import ProductGrid from '@/components/ProductGrid';
import CategoryBannerCarousel from '@/components/products/CategoryBannerCarousel';
import CategoryCircleStrip from '@/components/products/CategoryCircleStrip';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildCollectionDescription,
  buildCollectionMetadata,
  buildCollectionPageJsonLd,
  findCategoryBySlug,
  serializeJsonLd,
  titleFromHandle,
} from '@/lib/seo';
import type { Product } from '@/types';

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; preview?: string }>;
};

type LandingData =
  | {
      kind: 'category';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      children: Array<{ id: string; name: string; slug?: string }>;
      status?: string;
      type?: string;
    }
  | {
      kind: 'collection';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      children: [];
      status?: string;
      type?: string;
    };

async function resolveLanding(handle: string): Promise<LandingData | null> {
  const [categoriesData, collectionsData] = await Promise.all([
    api.getCategories(),
    api.getCollections(),
  ]);

  const category = findCategoryBySlug(categoriesData.categories || [], handle);
  if (category) {
    return {
      kind: 'category',
      id: category.id,
      handle: category.slug || category.handle || handle,
      title: category.name || titleFromHandle(handle),
      description: buildCollectionDescription({
        name: category.name || titleFromHandle(handle),
        description: category.description || undefined,
      }),
      image: category.header_image_url || category.image,
      children: (category.children || []).map((child) => ({
        id: child.id,
        name: child.name || titleFromHandle(child.slug || child.handle || ''),
        slug: child.slug || child.handle,
      })),
    };
  }

  const collection = (collectionsData.collections || []).find(
    (item: { id: string; handle?: string }) =>
      item.handle === handle || item.id === handle
  );

  if (!collection) return null;

  if (collection.handle && collection.handle !== handle) {
    permanentRedirect(`/collections/${collection.handle}`);
  }

  const title = collection.title || titleFromHandle(handle);

  return {
    kind: 'collection',
    id: collection.id,
    handle: collection.handle || handle,
    title,
    description: buildCollectionDescription({
      name: title,
      description:
        typeof collection.metadata?.description === 'string'
          ? collection.metadata.description
          : collection.description || undefined,
    }),
    image: collection.cover_image_url || collection.image,
    children: [],
    status: collection.status,
    type: collection.type,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const landing = await resolveLanding(handle);

  if (!landing) {
    return {
      title: 'Collection Not Found',
      robots: { index: false, follow: false },
    };
  }

  return buildCollectionMetadata({
    name: landing.title,
    path: `/collections/${landing.handle}`,
    description: landing.description,
    image: landing.image,
    kind: landing.kind,
  });
}

export default async function CollectionPage({
  params,
  searchParams,
}: Props) {
  const { handle } = await params;
  const { sort, preview } = await searchParams;
  const landing = (await resolveLanding(handle)) || notFound();

  // Task 5.7: Draft collections hidden from public (only admin preview allowed)
  if (landing.kind === 'collection' && landing.status === 'draft' && preview !== 'true') {
    redirect('/collections');
  }

  const [productsResponse, bannersResponse, circlesResponse, spotlightResponse, allCollectionsResponse] =
    await Promise.all([
      api.getProducts({
        limit: 50,
        sort,
        ...(landing.kind === 'category'
          ? { category_id: landing.id }
          : { collection_id: landing.id }),
      }),
      api.getBanners(),
      api.getCategoryCircles(),
      api.getSpotlightProducts(),
      landing.kind === 'collection' && landing.type
        ? api.getCollections()
        : Promise.resolve(null),
    ]);

  const products = productsResponse.products || [];
  const categoryPageBanners = bannersResponse.banners || [];
  const categoryCircles = circlesResponse.circles || [];
  const spotlightProducts = spotlightResponse.featuredProducts || [];
  const featuredProducts = products.slice(0, 4);

  // Task 5.5: Related collections — same type, active, excluding current
  const relatedCollections: Array<{ id: string; handle: string; title: string; cover_image_url?: string; image?: string }> =
    allCollectionsResponse
      ? (allCollectionsResponse.collections || [])
          .filter((c: { id: string; type?: string; status?: string; handle?: string }) =>
            c.id !== landing.id &&
            c.type === landing.type &&
            c.status === 'active' &&
            c.handle
          )
          .slice(0, 3)
      : [];
  const schema = [
    buildCollectionPageJsonLd({
      name: landing.title,
      path: `/collections/${landing.handle}`,
      description: landing.description,
      image: landing.image,
      items: featuredProducts.map((product) => ({
        name: product.title,
        path: `/products/${product.handle}`,
      })),
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/collections' },
      { name: landing.title, path: `/collections/${landing.handle}` },
    ]),
  ];

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(schema),
        }}
      />

      {categoryPageBanners.length > 0 ? (
        <>
          <CategoryBannerCarousel banners={categoryPageBanners} />
          <div className="hidden md:block">
            <PageHero
              title={landing.title}
              subtitle={landing.kind === 'category' ? 'Category' : 'Collection'}
              description={landing.description}
              image={landing.image || undefined}
            />
          </div>
        </>
      ) : (
        <PageHero
          title={landing.title}
          subtitle={landing.kind === 'category' ? 'Category' : 'Collection'}
          description={landing.description}
          image={landing.image || undefined}
        />
      )}

      {categoryCircles.length > 0 ? (
        <CategoryCircleStrip circles={categoryCircles} />
      ) : null}

      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <nav
          aria-label="Breadcrumb"
          className="listing-breadcrumb mb-8 flex items-center gap-2"
        >
          <Link href="/" className="transition-colors hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/collections"
            className="transition-colors hover:text-stone-900"
          >
            Collections
          </Link>
          <span>/</span>
          <span className="text-stone-700">{landing.title}</span>
        </nav>

        <section className="grid gap-8 border-b border-stone-100 pb-12 md:grid-cols-[1.5fr,1fr] md:gap-12 lg:gap-16">
          <div>
            <h2 className="collection-detail-title">
              {landing.kind === 'category'
                ? `New Arrivals in ${landing.title}`
                : `Explore the ${landing.title} Collection`}
            </h2>
            <p className="collection-detail-copy mt-4 max-w-3xl">
              {landing.description}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="collection-sidebar-heading">
                Popular Links
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/"
                  className="collection-sidebar-link transition-colors hover:text-amber-700"
                >
                  Shop Handcrafted Ethnic Wear
                </Link>
                {featuredProducts.slice(0, 3).map((product: Product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className="collection-sidebar-subtle-link transition-colors hover:text-stone-900"
                  >
                    Shop {product.title}
                  </Link>
                ))}
              </div>
            </div>

            {landing.children.length > 0 && (
              <div>
                <h2 className="collection-sidebar-heading">
                  Subcategories
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {landing.children.map((child) =>
                    child.slug ? (
                      <Link
                        key={child.id}
                        href={`/collections/${child.slug}`}
                        className="collection-subcategory-link border border-stone-200 px-4 py-2 transition-colors hover:border-stone-900 hover:text-stone-900"
                      >
                        Shop {child.name}
                      </Link>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {featuredProducts.length > 0 && (
          <section className="py-12 md:py-16 lg:py-24">
            <h2 className="collection-section-title">
              Bestselling {landing.title}
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
              {featuredProducts.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="border border-stone-200 p-5 transition-colors hover:border-stone-900"
                >
                  <p className="collection-card-kicker">
                    {landing.kind === 'category'
                      ? `Shop ${landing.title}`
                      : 'Featured Product'}
                  </p>
                  <p className="collection-card-product-title mt-2">
                    {product.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="pb-12 md:pb-16 lg:pb-24">
          {products.length > 0 ? (
            <ProductGrid
              initialProducts={products}
              spotlightProducts={spotlightProducts}
            />
          ) : (
            <div className="py-12 text-center md:py-16 lg:py-24">
              <p className="collection-empty-copy">
                No products found in this section right now. Check back soon.
              </p>
            </div>
          )}
        </section>

        {/* Task 5.5: Related Collections */}
        {relatedCollections.length > 0 && (
          <section className="border-t border-stone-100 py-12 md:py-16">
            <h2 className="collection-section-title mb-8">Related Collections</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {relatedCollections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.handle}`}
                  className="group relative overflow-hidden rounded-lg border border-stone-200 transition-colors hover:border-stone-900"
                >
                  {(col.cover_image_url || col.image) && (
                    <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                      <img
                        src={col.cover_image_url || col.image}
                        alt={col.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-medium text-stone-900">{col.title}</p>
                    <p className="mt-1 text-sm text-stone-500">Shop collection →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
