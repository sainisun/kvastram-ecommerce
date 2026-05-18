import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, permanentRedirect, redirect } from 'next/navigation';

import PageHero from '@/components/hero/PageHero';
import ProductGrid from '@/components/ProductGrid';
import CategoryBannerCarousel from '@/components/products/CategoryBannerCarousel';
import CategoryCircleStrip from '@/components/products/CategoryCircleStrip';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { storefrontDiscoveryQuickLinks } from '@/config/storefront-discovery';
import { storefrontTrust } from '@/config/storefront-trust';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildCollectionDescription,
  buildCollectionMetadata,
  buildCollectionPageJsonLd,
  findCategoryBySlug,
  getOgLocaleForLocale,
  serializeJsonLd,
  titleFromHandle,
} from '@/lib/seo';
import type { Product } from '@/types';

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; preview?: string }>;
};

type LandingSeoFields = {
  product_count?: number;
  seo_title?: string | null;
  seo_desc?: string | null;
  canonical_url?: string | null;
  is_indexable?: boolean | null;
  robots_policy?: string | null;
  faq_items?: Array<{ question: string; answer: string }> | null;
  answer_capsule?: string | null;
};

type LandingData =
  | ({
      kind: 'category';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      children: Array<{ id: string; name: string; slug?: string }>;
      status?: string;
      type?: string;
    } & LandingSeoFields)
  | ({
      kind: 'collection';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      children: [];
      status?: string;
      type?: string;
    } & LandingSeoFields)
  | ({
      kind: 'seo_landing';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      children: [];
      status?: string;
      type?: string;
      intro_content?: string | null;
      outro_content?: string | null;
      rule_definition?: Record<string, unknown> | null;
    } & LandingSeoFields);

async function resolveLanding(handle: string): Promise<LandingData | null> {
  const [categoriesData, collectionsData, seoLandingPage] = await Promise.all([
    api.getCategories(),
    api.getCollections(),
    api.getSeoLandingPage(handle),
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

  let collection = (collectionsData.collections || []).find(
    (item: { id: string; handle?: string }) =>
      item.handle === handle || item.id === handle
  );

  const directCollection = await api.getCollection(handle);
  if (directCollection.collection) {
    collection = directCollection.collection;
  }

  if (!collection && seoLandingPage?.status === 'active') {
    return {
      kind: 'seo_landing',
      id: seoLandingPage.id,
      handle: seoLandingPage.slug || handle,
      title: seoLandingPage.title || titleFromHandle(handle),
      description:
        seoLandingPage.meta_description ||
        buildCollectionDescription({
          name: seoLandingPage.title || titleFromHandle(handle),
          description: seoLandingPage.intro_content || undefined,
        }),
      image: seoLandingPage.metadata?.image_url || null,
      children: [],
      status: seoLandingPage.status,
      type: 'seo_landing',
      intro_content: seoLandingPage.intro_content,
      outro_content: seoLandingPage.outro_content,
      rule_definition: seoLandingPage.rule_definition,
      product_count: seoLandingPage.metadata?.product_count,
    };
  }

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
    product_count: collection.product_count,
    seo_title: collection.seo_title,
    seo_desc: collection.seo_desc,
    canonical_url: collection.canonical_url,
    is_indexable: collection.is_indexable,
    robots_policy: collection.robots_policy,
    faq_items: collection.faq_items,
    answer_capsule: collection.answer_capsule,
  };
}

async function fetchLandingProductCount(landing: LandingData) {
  if (typeof landing.product_count === 'number') {
    return landing.product_count;
  }

  const response = await api.getProducts({
    limit: 1,
    ...(landing.kind === 'category'
      ? { category_id: landing.id }
      : landing.kind === 'collection'
        ? { collection_id: landing.id }
        : {
            category_id:
              typeof landing.rule_definition?.category_id === 'string'
                ? landing.rule_definition.category_id
                : undefined,
            collection_id:
              typeof landing.rule_definition?.collection_id === 'string'
                ? landing.rule_definition.collection_id
                : undefined,
            search:
              typeof landing.rule_definition?.search === 'string'
                ? landing.rule_definition.search
                : undefined,
            attribute_code:
              typeof landing.rule_definition?.attribute_code === 'string'
                ? landing.rule_definition.attribute_code
                : undefined,
            attribute_value:
              typeof landing.rule_definition?.attribute_value === 'string'
                ? landing.rule_definition.attribute_value
                : undefined,
          }),
  });

  return response.total || response.products?.length || 0;
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

  const productCount = await fetchLandingProductCount(landing);
  const requestHeaders = await headers();
  const robotsPolicy = landing.robots_policy || 'index,follow';
  const noindex =
    productCount === 0 ||
    landing.is_indexable === false ||
    robotsPolicy.startsWith('noindex');

  return buildCollectionMetadata({
    name: landing.title,
    title: landing.seo_title,
    path: `/collections/${landing.handle}`,
    description: landing.seo_desc || landing.description,
    image: landing.image,
    kind: landing.kind === 'category' ? 'category' : 'collection',
    noindex,
    robotsFollow: !robotsPolicy.endsWith('nofollow'),
    canonicalUrl: landing.canonical_url || undefined,
    ogLocale: getOgLocaleForLocale(requestHeaders.get('x-kvastram-locale')),
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
          : landing.kind === 'collection'
            ? { collection_id: landing.id }
            : {
                category_id:
                  typeof landing.rule_definition?.category_id === 'string'
                    ? landing.rule_definition.category_id
                    : undefined,
                collection_id:
                  typeof landing.rule_definition?.collection_id === 'string'
                    ? landing.rule_definition.collection_id
                    : undefined,
                search:
                  typeof landing.rule_definition?.search === 'string'
                    ? landing.rule_definition.search
                    : undefined,
                attribute_code:
                  typeof landing.rule_definition?.attribute_code === 'string'
                    ? landing.rule_definition.attribute_code
                    : undefined,
                attribute_value:
                  typeof landing.rule_definition?.attribute_value === 'string'
                    ? landing.rule_definition.attribute_value
                    : undefined,
              }),
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
  const collectionDiscoveryLinks = storefrontDiscoveryQuickLinks.slice(0, 4);

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
    ...(landing.faq_items && landing.faq_items.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: landing.faq_items.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[var(--ds-surface-paper)]">
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

      <div className="kv-page-container mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <nav
          aria-label="Breadcrumb"
          className="listing-breadcrumb mb-8 flex items-center gap-2"
        >
          <Link href="/" className="transition-colors hover:text-[var(--ds-text-primary)]">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/collections"
            className="transition-colors hover:text-[var(--ds-text-primary)]"
          >
            Collections
          </Link>
          <span>/</span>
          <span className="text-[var(--ds-text-secondary)]">{landing.title}</span>
        </nav>

        <section className="grid gap-8 border-b border-[var(--ds-border-subtle)] pb-12 md:grid-cols-[1.5fr,1fr] md:gap-12 lg:gap-16">
          <div>
            <h2 className="collection-detail-title">
              {landing.kind === 'category'
                ? `New Arrivals in ${landing.title}`
                : `Explore the ${landing.title} Collection`}
            </h2>
            <p className="collection-detail-copy mt-4 max-w-3xl">
              {landing.answer_capsule ||
                (landing.kind === 'seo_landing' && landing.intro_content
                  ? landing.intro_content
                  : landing.description)}
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
                  className="collection-sidebar-link transition-colors hover:text-[var(--ds-warning-text)]"
                >
                  Shop Handcrafted Ethnic Wear
                </Link>
                {featuredProducts.slice(0, 3).map((product: Product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className="collection-sidebar-subtle-link transition-colors hover:text-[var(--ds-text-primary)]"
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
                        className="collection-subcategory-link border border-[var(--ds-border-subtle)] px-4 py-2 transition-colors hover:border-[var(--ds-text-primary)] hover:text-[var(--ds-text-primary)]"
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

        <section className="grid gap-6 border-b border-[var(--ds-border-subtle)] py-10 md:grid-cols-[1.3fr,0.7fr]">
          <div>
            <h2 className="collection-section-title">Shop by intent</h2>
            <p className="collection-detail-copy mt-3 max-w-2xl">
              If you are still exploring, jump into curated discovery routes by
              occasion, material, or color instead of exiting the storefront.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {collectionDiscoveryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-[var(--ds-border-subtle)] px-4 py-2 text-body-sm text-[var(--ds-text-secondary)] transition-colors hover:border-[var(--ds-text-primary)] hover:text-[var(--ds-text-primary)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] p-6">
            <p className="collection-card-kicker">Need purchase clarity?</p>
            <h3 className="mt-2 text-body-lg type-medium text-[var(--ds-text-primary)]">
              Shipping, returns, and payment help are visible before checkout.
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={storefrontTrust.policyRoutes.shipping}
                className="collection-subcategory-link border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] px-4 py-2 transition-colors hover:border-[var(--ds-text-primary)] hover:text-[var(--ds-text-primary)]"
              >
                Shipping
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.returns}
                className="collection-subcategory-link border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] px-4 py-2 transition-colors hover:border-[var(--ds-text-primary)] hover:text-[var(--ds-text-primary)]"
              >
                Returns
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.paymentHelp}
                className="collection-subcategory-link border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] px-4 py-2 transition-colors hover:border-[var(--ds-text-primary)] hover:text-[var(--ds-text-primary)]"
              >
                Payment Help
              </Link>
            </div>
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
                  className="border border-[var(--ds-border-subtle)] p-5 transition-colors hover:border-[var(--ds-text-primary)]"
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
            <EmptyState
              title="No products found in this section right now."
              description="Check back soon or explore another Kvastram edit."
              className="my-12 md:my-16 lg:my-24"
              actions={collectionDiscoveryLinks.map((item) => (
                <ButtonLink
                  key={item.href}
                  href={item.href}
                  variant="outline"
                  size="sm"
                  className="rounded-full normal-case tracking-normal"
                >
                  {item.label}
                </ButtonLink>
              ))}
            />
          )}
        </section>

        {landing.kind === 'seo_landing' && landing.outro_content ? (
          <section className="border-t border-[var(--ds-border-subtle)] py-10">
            <p className="collection-detail-copy mx-auto max-w-3xl text-center">
              {landing.outro_content}
            </p>
          </section>
        ) : null}

        {landing.faq_items && landing.faq_items.length > 0 ? (
          <section className="border-t border-[var(--ds-border-subtle)] py-10">
            <div className="mx-auto max-w-3xl space-y-6">
              {landing.faq_items.map((item) => (
                <div key={item.question}>
                  <h2 className="collection-sidebar-heading">{item.question}</h2>
                  <p className="collection-detail-copy mt-2">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Task 5.5: Related Collections */}
        {relatedCollections.length > 0 && (
          <section className="border-t border-[var(--ds-border-subtle)] py-12 md:py-16">
            <h2 className="collection-section-title mb-8">Related Collections</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {relatedCollections.map((col) => {
                const collectionImage = col.cover_image_url || col.image;

                return (
                  <Link
                    key={col.id}
                    href={`/collections/${col.handle}`}
                    className="group relative overflow-hidden rounded-lg border border-[var(--ds-border-subtle)] transition-colors hover:border-[var(--ds-text-primary)]"
                  >
                    {collectionImage ? (
                      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--ds-surface-soft)]">
                        <OptimizedImage
                          src={collectionImage}
                          alt={col.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : null}
                    <div className="p-4">
                      <p className="type-medium text-[var(--ds-text-primary)]">{col.title}</p>
                      <p className="mt-1 text-body-sm text-[var(--ds-text-muted)]">Shop collection →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
