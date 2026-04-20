import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
};

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
}: {
  collection: CollectionSummary;
  count: number;
}) {
  return (
    <Link href={`/collections/${collection.handle}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        {collection.image ? (
          <OptimizedImage
            src={collection.image}
            alt={`${collection.title} collection - Kvastram`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-200">
            <span className="font-heading text-3xl font-semibold uppercase tracking-[0.02em] text-stone-400">
              {collection.title}
            </span>
          </div>
        )}
      </div>
      <div className="px-1 pt-4">
        <h2 className="font-heading text-[20px] font-medium leading-tight text-stone-950">
          {collection.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-[12px] uppercase tracking-[0.16em] text-stone-500">
          {collection.description || 'Real collection stories from the catalog'}
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-stone-400">
          {count} products
        </p>
      </div>
    </Link>
  );
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

  const collectionCounts = await Promise.allSettled(
    visibleCollections.map(async (collection: CollectionSummary) => {
      const result = await api.getProducts({
        limit: 1,
        collection_id: collection.id,
      });
      return { id: collection.id, total: result.total || 0 };
    })
  );
  const counts = new Map(
    collectionCounts
      .filter(
        (item): item is PromiseFulfilledResult<{ id: string; total: number }> =>
          item.status === 'fulfilled'
      )
      .map((item) => [item.value.id, item.value.total])
  );

  const schema = [
    buildCollectionPageJsonLd({
      name: 'Kvastram Collections',
      path: '/collections',
      description:
        'Explore handcrafted ethnic wear collections, from festive kurtis to artisanal shawls and occasion-ready silhouettes.',
      image: '/images/home/collection-bridal.jpg',
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
      <div className="min-h-screen bg-white">
        <section className="relative h-[360px] overflow-hidden bg-stone-100 sm:h-[420px]">
          <OptimizedImage
            src="/images/home/collection-bridal.jpg"
            alt="Collections"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.2),rgba(0,0,0,0.3))]" />
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.25em] text-white/80">
                Curated Series
              </div>
              <h1 className="mt-4 font-heading text-[clamp(44px,6vw,72px)] font-normal leading-none tracking-[-0.03em] text-white">
                Collections
              </h1>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <p className="text-lg text-stone-500">No collections found. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(schema),
        }}
      />

      <section className="relative h-[360px] overflow-hidden bg-stone-100 sm:h-[420px]">
        <OptimizedImage
          src="/images/home/collection-bridal.jpg"
          alt="Collections"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.2),rgba(0,0,0,0.3))]" />
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.25em] text-white/80">
              Curated Series
            </div>
            <h1 className="mt-4 font-heading text-[clamp(44px,6vw,72px)] font-normal leading-none tracking-[-0.03em] text-white">
              Our <em className="italic">Collections</em>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-heading text-[18px] font-normal italic leading-8 text-white/90">
              From everyday kurta sets to handcrafted bridal lehengas — every
              edit tells a story.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400"
        >
          <Link href="/" className="transition-colors hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-700">Collections</span>
        </nav>

        <section className="grid gap-4 sm:grid-cols-3">
          {featuredCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group relative overflow-hidden bg-stone-100"
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
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-200">
                    <span className="font-heading text-[26px] uppercase tracking-[0.02em] text-stone-400">
                      {collection.title}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.45))]" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h2 className="font-heading text-[28px] font-normal leading-none tracking-[-0.03em]">
                    {collection.title}
                  </h2>
                  <p className="mt-3 max-w-[18rem] text-[13px] leading-6 text-white/85">
                    {collection.description || 'Timeless edits crafted for the modern wardrobe.'}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    Shop Now
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <div className="sticky top-[72px] z-20 -mx-4 mt-10 border-b border-stone-100 bg-white/95 px-4 py-5 backdrop-blur-sm sm:mx-0 sm:px-0">
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex rounded-full border border-stone-950 bg-stone-950 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
              All
            </span>
            <span className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-700">
              By Occasion
            </span>
            <span className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-700">
              By Season
            </span>
            <span className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-700">
              By Fabric
            </span>
            <span className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-700">
              By Silhouette
            </span>
          </div>
        </div>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              count={counts.get(collection.id) || 0}
            />
          ))}
        </section>

        {collections.length > visibleCollections.length ? (
          <div className="mt-14 text-center">
            <Link
              href="/collections?show=all"
              className="inline-flex items-center gap-2 border-b border-stone-900 pb-1 text-stone-900 transition-colors hover:border-stone-600 hover:text-stone-600"
            >
              Load More Collections
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : showAll ? (
          <div className="mt-14 text-center">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 border-b border-stone-900 pb-1 text-stone-900 transition-colors hover:border-stone-600 hover:text-stone-600"
            >
              View Fewer Collections
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}

        <section className="mt-16 rounded-[36px] border border-stone-100 bg-stone-50 px-6 py-10 sm:px-8">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
              Need help
            </div>
            <h2 className="mt-3 font-heading text-[clamp(32px,4vw,52px)] font-normal leading-none tracking-[-0.03em] text-stone-950">
              Need help <em className="italic">choosing?</em>
            </h2>
            <p className="mt-4 max-w-xl font-heading text-[18px] font-normal italic leading-8 text-stone-700">
              Pick the right edit with real humans, quick answers, and styling support rooted in the live catalog.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link
              href="/contact"
              className="rounded-[24px] border border-stone-200 bg-white p-5 transition-colors hover:border-stone-900"
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                Book a Stylist
              </div>
              <h3 className="mt-3 font-heading text-[22px] font-medium text-stone-950">
                Personal 1-on-1 consultation
              </h3>
            </Link>
            <Link
              href="https://wa.me/message/kvastram"
              className="rounded-[24px] border border-stone-200 bg-white p-5 transition-colors hover:border-stone-900"
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                WhatsApp Us
              </div>
              <h3 className="mt-3 font-heading text-[22px] font-medium text-stone-950">
                Quick answers, real humans
              </h3>
            </Link>
            <Link
              href="/faq"
              className="rounded-[24px] border border-stone-200 bg-white p-5 transition-colors hover:border-stone-900"
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                Size Guide
              </div>
              <h3 className="mt-3 font-heading text-[22px] font-medium text-stone-950">
                Find your perfect fit
              </h3>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
