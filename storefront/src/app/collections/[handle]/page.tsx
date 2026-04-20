import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';

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
  searchParams: Promise<{ sort?: string }>;
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
    }
  | {
      kind: 'collection';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      children: [];
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
          : undefined,
    }),
    image: collection.image,
    children: [],
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
  const { sort } = await searchParams;
  const landing = (await resolveLanding(handle)) || notFound();

  const [productsResponse, bannersResponse, circlesResponse, spotlightResponse] =
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
    ]);

  const products = productsResponse.products || [];
  const categoryPageBanners = bannersResponse.banners || [];
  const categoryCircles = circlesResponse.circles || [];
  const spotlightProducts = spotlightResponse.featuredProducts || [];
  const featuredProducts = products.slice(0, 4);
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
              image={landing.image || '/images/home/collection-bridal.jpg'}
            />
          </div>
        </>
      ) : (
        <PageHero
          title={landing.title}
          subtitle={landing.kind === 'category' ? 'Category' : 'Collection'}
          description={landing.description}
          image={landing.image || '/images/home/collection-bridal.jpg'}
        />
      )}

      {categoryCircles.length > 0 ? (
        <CategoryCircleStrip circles={categoryCircles} />
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <nav
          aria-label="Breadcrumb"
          className="font-body mb-8 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400"
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

        <section className="grid gap-10 border-b border-stone-100 pb-12 md:grid-cols-[1.5fr,1fr]">
          <div>
            <h2 className="font-heading text-[clamp(32px,4vw,54px)] font-normal leading-[1.02] tracking-[-0.03em] text-stone-900">
              {landing.kind === 'category'
                ? `New Arrivals in ${landing.title}`
                : `Explore the ${landing.title} Collection`}
            </h2>
            <p className="font-body mt-4 max-w-3xl text-[15px] font-[300] leading-[1.8] text-stone-600 md:text-lg">
              {landing.description}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="font-body text-[12px] font-medium uppercase tracking-[0.08em] text-stone-500">
                Popular Links
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/"
                  className="font-body text-[15px] font-medium text-stone-900 transition-colors hover:text-amber-700"
                >
                  Shop Handcrafted Ethnic Wear
                </Link>
                {featuredProducts.slice(0, 3).map((product: Product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className="font-body text-[15px] font-[300] text-stone-600 transition-colors hover:text-stone-900"
                  >
                    Shop {product.title}
                  </Link>
                ))}
              </div>
            </div>

            {landing.children.length > 0 && (
              <div>
                <h2 className="font-body text-[12px] font-medium uppercase tracking-[0.08em] text-stone-500">
                  Subcategories
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {landing.children.map((child) =>
                    child.slug ? (
                      <Link
                        key={child.id}
                        href={`/collections/${child.slug}`}
                        className="font-body border border-stone-200 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
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
          <section className="py-12">
            <h2 className="font-heading text-[clamp(28px,3.4vw,44px)] font-normal leading-[1.02] tracking-[-0.03em] text-stone-900">
              Bestselling {landing.title}
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {featuredProducts.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="border border-stone-200 p-5 transition-colors hover:border-stone-900"
                >
                  <p className="font-body text-[12px] font-medium uppercase tracking-[0.08em] text-stone-500">
                    {landing.kind === 'category'
                      ? `Shop ${landing.title}`
                      : 'Featured Product'}
                  </p>
                  <p className="font-body mt-2 text-[15px] font-normal leading-[1.55] text-stone-900">
                    {product.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="pb-16">
          {products.length > 0 ? (
            <ProductGrid
              initialProducts={products}
              spotlightProducts={spotlightProducts}
            />
          ) : (
            <div className="py-24 text-center">
              <p className="text-lg text-stone-500">
                No products found in this section right now. Check back soon.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
