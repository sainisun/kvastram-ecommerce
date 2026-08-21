'use client';

import Link from 'next/link';
import { ButtonLink, HomepageContainer, OptimizedImage } from '@/design-system';
import type { HomepageCategoryCard, HomepageCollection } from '@/types/homepage';

type EditorialDiscoveryProps = {
  categories: HomepageCategoryCard[];
  collections: HomepageCollection[];
};

function resolveCollectionHref(collection: HomepageCollection) {
  return `/collections/${collection.handle}`;
}

export function EditorialDiscovery({
  categories,
  collections,
}: EditorialDiscoveryProps) {
  const categoryEdit = categories.filter((category) => category.is_active).slice(0, 3);
  const collectionFeature = collections.slice(0, 1)[0];

  if (categoryEdit.length === 0 && !collectionFeature) return null;

  return (
    <section
      className="border-y border-border-subtle bg-surface-page py-[clamp(3.5rem,8vw,7rem)]"
      aria-labelledby="editorial-discovery-title"
      data-home-section="editorial-discovery"
    >
      <HomepageContainer>
        <div className="mb-[clamp(1.75rem,4vw,3rem)] flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="kv-tag">The Odhvica edit</p>
            <h2
              id="editorial-discovery-title"
              className="mt-4 font-display text-[clamp(2.35rem,5vw,4.75rem)] leading-[0.94] tracking-[-0.035em] text-primary"
            >
              Pieces with a point of view.
            </h2>
          </div>
          <ButtonLink href="/products" variant="outline" size="md" className="self-start md:self-auto">
            Explore all pieces
          </ButtonLink>
        </div>

        {categoryEdit.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3 md:gap-5">
            {categoryEdit.map((category, index) => (
              <Link
                href={category.link_url || '/products'}
                key={category.id}
                className="group relative aspect-[4/5] overflow-hidden bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary"
              >
                <OptimizedImage
                  src={category.image_url}
                  alt={category.name}
                  fill
                  sizes="(max-width: 639px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(var(--ds-ink-rgb),0.02)_38%,rgba(var(--ds-ink-rgb),0.7)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-inverse md:p-7">
                  <span className="font-label text-body-xs uppercase tracking-[0.18em] text-[rgba(var(--ds-white-rgb),0.8)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.7rem)] leading-none">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {collectionFeature ? (
          <Link
            href={resolveCollectionHref(collectionFeature)}
            className="group mt-5 grid overflow-hidden border border-border-subtle bg-surface-paper md:mt-8 md:grid-cols-[1.12fr_0.88fr]"
          >
            <div className="relative min-h-[260px] md:min-h-[420px]">
              <OptimizedImage
                src={collectionFeature.image}
                alt={collectionFeature.title}
                fill
                sizes="(max-width: 767px) 100vw, 55vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-col justify-between p-6 md:p-10 lg:p-14">
              <div>
                <p className="kv-tag">Collection note</p>
                <h3 className="mt-4 font-display text-[clamp(2.1rem,4vw,4rem)] leading-[0.94] tracking-[-0.03em] text-primary">
                  {collectionFeature.title}
                </h3>
                {collectionFeature.description ? (
                  <p className="mt-5 max-w-md font-body text-body-md leading-token-relaxed text-secondary">
                    {collectionFeature.description}
                  </p>
                ) : null}
              </div>
              <span className="mt-10 font-label text-body-xs uppercase tracking-[0.18em] text-accent-primary">
                Enter the collection
              </span>
            </div>
          </Link>
        ) : null}
      </HomepageContainer>
    </section>
  );
}
