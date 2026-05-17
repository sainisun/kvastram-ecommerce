import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { EmptyState } from '@/components/ui/EmptyState';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';
import {
  buildBasicPageMetadata,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

export const revalidate = 60;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type CollectionSummary = {
  id: string;
  title: string;
  handle: string;
  image?: string | null;
  description?: string | null;
  product_count?: number | string | null;
};

const COLLECTION_GRADIENTS = [
  'from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-accent-soft)]',
  'from-[var(--ds-success-text)] via-[var(--ds-success)] to-[var(--ds-success-bg)]',
  'from-[var(--ds-text-primary)] via-[var(--ds-text-muted)] to-[var(--ds-accent-soft)]',
  'from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-surface-soft)]',
];

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Collections | Handcrafted Ethnic Wear for Women',
  description:
    'Explore Kvastram collections for handcrafted kurtis, shawls, wraps, sarees and premium ethnic wear for women.',
  path: '/collections',
  image: '/images/home/collection-bridal.jpg',
  keywords: [
    'ethnic wear collections',
    'handcrafted kurtis online',
    'shawls and sarees collection',
  ],
});

function CollectionCard({
  collection,
  count,
  index,
}: {
  collection: CollectionSummary;
  count: number;
  index: number;
}) {
  const gradient = COLLECTION_GRADIENTS[index % COLLECTION_GRADIENTS.length];

  return (
    <Link href={`/collections/${collection.handle}`} className="group block">
      <div className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br ${gradient}`}>
        {collection.image ? (
          <OptimizedImage
            src={collection.image}
            alt={`${collection.title} collection - Kvastram`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
            <span className="collection-card-placeholder">
              {collection.title}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-black-rgb),0.02),rgba(var(--ds-black-rgb),0.36))]" />
        <div className="collection-count-badge absolute bottom-4 left-4 rounded-full bg-[var(--ds-surface-paper)]/90 px-3 py-1">
          {count} products
        </div>
      </div>
      <div className="px-1 pt-4">
        <h2 className="collection-card-title">
          {collection.title}
        </h2>
        <p className="collection-card-copy mt-1 line-clamp-2">
          {collection.description || 'View collection'}
        </p>
      </div>
    </Link>
  );
}

function getProductCount(collection: CollectionSummary) {
  const rawCount = collection.product_count;
  if (typeof rawCount === 'number') return rawCount;
  if (typeof rawCount === 'string') {
    const parsed = Number.parseInt(rawCount, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const showAll = params.show === 'all';

  const data = await api.getCollections();
  const collections: CollectionSummary[] = data.collections || [];
  const featuredCollections = collections.slice(0, 3);
  const visibleCollections = showAll ? collections : collections.slice(0, 12);
  const heroImage = collections.find((collection) => collection.image)?.image;

  const schema = [
    buildCollectionPageJsonLd({
      name: 'Kvastram Collections',
      path: '/collections',
      description:
        'Explore handcrafted ethnic wear collections, from festive kurtis to artisanal shawls and occasion-ready silhouettes.',
      image: heroImage || '',
      items: collections.map((collection: CollectionSummary) => ({
        name: collection.title,
        path: `/collections/${collection.handle}`,
      })),
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/collections' },
    ]),
  ];

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--ds-surface-paper)]">
        <section className="relative h-[360px] overflow-hidden bg-[var(--ds-surface-soft)] sm:h-[420px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-surface-paper-rgb),0.2),rgba(var(--ds-black-rgb),0.3))]" />
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <div className="max-w-3xl">
              <div className="collection-hero-eyebrow">
                Curated Series
              </div>
              <h1 className="collection-hero-title mt-4">
                Collections
              </h1>
            </div>
          </div>
        </section>
        <div className="kv-page-container mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
          <EmptyState
            title="No collections found."
            description="Check back soon for new curated series."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ds-surface-paper)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(schema),
        }}
      />

      <section className="relative h-[360px] overflow-hidden bg-[var(--ds-surface-soft)] sm:h-[420px]">
        {heroImage ? (
          <OptimizedImage
            src={heroImage}
            alt="Collections"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-surface-paper-rgb),0.2),rgba(var(--ds-black-rgb),0.3))]" />
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <div className="max-w-3xl">
            <div className="collection-hero-eyebrow">
              Curated Series
            </div>
            <h1 className="collection-hero-title mt-4">
              Our <em className="italic">Collections</em>
            </h1>
            <p className="collection-hero-copy mx-auto mt-4 max-w-2xl italic">
              From everyday kurta sets to handcrafted bridal lehengas — every
              edit tells a story.
            </p>
          </div>
        </div>
      </section>

      <div className="kv-page-container mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <nav
          aria-label="Breadcrumb"
          className="listing-breadcrumb mb-10 flex items-center gap-2"
        >
          <Link href="/" className="transition-colors hover:text-[var(--ds-text-primary)]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--ds-text-secondary)]">Collections</span>
        </nav>

        <section className="grid gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:gap-x-8 lg:gap-y-16">
          {featuredCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group relative overflow-hidden bg-[var(--ds-surface-soft)]"
            >
              <div className="relative aspect-[3/4]">
                {collection.image ? (
                  <OptimizedImage
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--ds-surface-warm)]">
                    <span className="collection-feature-placeholder">
                      {collection.title}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-black-rgb),0.08),rgba(var(--ds-black-rgb),0.45))]" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-[var(--ds-text-inverse)]">
                  <h2 className="collection-feature-title">
                    {collection.title}
                  </h2>
                  {collection.description ? (
                    <p className="collection-feature-copy mt-3 max-w-[18rem]">
                      {collection.description}
                    </p>
                  ) : null}
                  <span className="collection-feature-link mt-4 inline-flex items-center gap-2">
                    Shop Now
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleCollections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              count={getProductCount(collection)}
              index={index}
            />
          ))}
        </section>

        {collections.length > visibleCollections.length ? (
          <div className="mt-14 text-center">
            <Link
              href="/collections?show=all"
              className="inline-flex items-center gap-2 border-b border-[var(--ds-text-primary)] pb-1 text-[var(--ds-text-primary)] transition-colors hover:border-[var(--ds-text-muted)] hover:text-[var(--ds-text-secondary)]"
            >
              Load More Collections
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : showAll ? (
          <div className="mt-14 text-center">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 border-b border-[var(--ds-text-primary)] pb-1 text-[var(--ds-text-primary)] transition-colors hover:border-[var(--ds-text-muted)] hover:text-[var(--ds-text-secondary)]"
            >
              View Fewer Collections
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}

      </div>
    </div>
  );
}
