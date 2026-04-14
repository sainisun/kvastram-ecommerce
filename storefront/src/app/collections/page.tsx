import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import PageHero from '@/components/hero/PageHero';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';
import {
  buildBasicPageMetadata,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

export const revalidate = 60;

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

export default async function CollectionsPage() {
  const data = await api.getCollections();
  const collections = data.collections || [];
  const schema = [
    buildCollectionPageJsonLd({
      name: 'Kvastram Collections',
      path: '/collections',
      description:
        'Explore handcrafted ethnic wear collections, from festive kurtis to artisanal shawls and occasion-ready silhouettes.',
      image: '/images/home/collection-bridal.jpg',
      items: collections.map(
        (collection: { title: string; handle: string }) => ({
          name: collection.title,
          path: `/collections/${collection.handle}`,
        })
      ),
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/collections' },
    ]),
  ];

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <PageHero
          title="Collections"
          subtitle="Curated Series"
          image="/images/home/collection-bridal.jpg"
        />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <p className="text-lg text-stone-500">
            No collections found. Check back soon!
          </p>
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

      <PageHero
        title="Collections"
        subtitle="Curated Series"
        description="Curated ethnic wear stories for the modern wardrobe, blending handcrafted Indian techniques with polished everyday styling."
        image="/images/home/collection-bridal.jpg"
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav
          aria-label="Breadcrumb"
          className="font-body mb-10 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400"
        >
          <Link href="/" className="transition-colors hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-700">Collections</span>
        </nav>

        <section className="space-y-24 pb-16">
          {collections.map(
            (
              collection: {
                id: string;
                title: string;
                handle: string;
                image?: string;
                metadata?: { description?: string };
              },
              index: number
            ) => (
              <article
                key={collection.id}
                className={`flex flex-col items-center gap-12 md:flex-row ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 md:w-1/2">
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

                <div className="w-full space-y-6 text-center md:w-1/2 md:text-left">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 md:text-sm">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-heading text-4xl font-semibold uppercase tracking-[0.02em] text-stone-900">
                    {collection.title}
                  </h2>
                  <p className="font-body max-w-md text-lg font-[300] leading-relaxed text-stone-600 md:mx-0">
                    {collection.metadata?.description ||
                      `Explore the ${collection.title} collection for handcrafted silhouettes, festive textures, and premium artisanal fabrics.`}
                  </p>
                  <div className="pt-4">
                    <Link
                      href={`/collections/${collection.handle}`}
                      className="inline-flex items-center gap-2 border-b border-stone-900 pb-1 text-stone-900 transition-colors hover:border-stone-600 hover:text-stone-600"
                    >
                      Shop {collection.title} Collection
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            )
          )}
        </section>
      </div>
    </div>
  );
}
