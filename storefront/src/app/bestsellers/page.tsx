import type { Metadata } from 'next';
import Link from 'next/link';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { RatingDisplay } from '@/components/ui/RatingDisplay';
import { api } from '@/lib/api';
import { formatPriceFromINR } from '@/lib/currency';
import {
  buildBasicPageMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from '@/lib/seo';
import {
  filterStorefrontReadyProducts,
  getProductPrimaryImage,
} from '@/lib/storefront-product-quality';
import type { Product } from '@/types';

export const revalidate = 60;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Bestsellers | Kvastram',
  description:
    'Shop the most loved Kvastram pieces, curated from bestselling products and admin-managed merchandising tags.',
  path: '/bestsellers',
  image: '/images/home/collection-bridal.jpg',
  keywords: ['bestsellers', 'most loved', 'kvastram bestsellers'],
});

function formatStat(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

function extractSizes(products: Product[]) {
  const sizes = new Set<string>();

  products.forEach((product) => {
    product.variants?.forEach((variant) => {
      if (variant.title) {
        sizes.add(variant.title);
      }
    });
  });

  return Array.from(sizes).slice(0, 7);
}

function productMatchesSize(product: Product, size: string) {
  if (!size) return true;
  return (
    product.variants?.some(
      (variant) => variant.title?.toLowerCase() === size.toLowerCase()
    ) ?? false
  );
}

function formatPrice(product: Product) {
  const variant = product.variants?.[0];
  const prices = variant?.prices || [];
  const inrPrice =
    prices.find((p) => p.currency_code?.toLowerCase() === 'inr') || prices[0];
  if (!inrPrice) return 'Contact for price';
  // Server component — always show INR; client components handle per-user currency
  return formatPriceFromINR(inrPrice.amount, 'INR', { INR: 1 });
}

export default async function BestsellersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selectedSize = typeof params.size === 'string' ? params.size : 'all';

  const [homepageResult, tagsResult, curatedResult] = await Promise.allSettled([
    api.getHomepageSettings(),
    api.getTags(),
    api.getSpotlightProducts('bestsellers'),
  ]);

  const homepageSettings =
    homepageResult.status === 'fulfilled'
      ? homepageResult.value.settings || {}
      : {};

  const bestsellerTag =
    tagsResult.status === 'fulfilled'
      ? (tagsResult.value.tags || []).find(
          (tag: { id: string; name: string }) =>
            tag.name?.toLowerCase() === 'bestseller' ||
            tag.name?.toLowerCase() === 'best seller'
        )
      : null;

  const curatedProducts =
    curatedResult.status === 'fulfilled'
      ? filterStorefrontReadyProducts(
          (curatedResult.value.featuredProducts || [])
          .map((item: { product?: Product | null }) => item.product)
          .filter((product: Product | null | undefined): product is Product =>
            Boolean(product?.id)
          )
        )
      : [];

  const [taggedProductsResult, fallbackProductsResult] = await Promise.allSettled([
    bestsellerTag
      ? api.getProducts({ limit: 24, tag_id: bestsellerTag.id, sort: 'newest' })
      : Promise.resolve({ products: [], total: 0 }),
    api.getProducts({ limit: 24, sort: 'newest' }),
  ]);

  const taggedProducts =
    taggedProductsResult.status === 'fulfilled'
      ? filterStorefrontReadyProducts(taggedProductsResult.value.products || [])
      : [];
  const fallbackProducts =
    fallbackProductsResult.status === 'fulfilled'
      ? filterStorefrontReadyProducts(fallbackProductsResult.value.products || [])
      : [];

  const sourceProducts =
    curatedProducts.length > 0
      ? curatedProducts
      : taggedProducts.length > 0
        ? taggedProducts
        : fallbackProducts;

  const products: Product[] = sourceProducts
    .filter((product: Product) => productMatchesSize(product, selectedSize))
    .slice(0, 9);

  const sizes = extractSizes(sourceProducts);

  const stats = [
    {
      value: formatStat(homepageSettings.stat_customer_rating),
      label: 'Average Rating',
    },
    {
      value: formatStat(homepageSettings.stat_happy_customers),
      label: 'Happy Customers',
    },
    {
      value: formatStat(homepageSettings.stat_return_policy),
      label: 'Would Recommend',
    },
    {
      value: formatStat(homepageSettings.stat_five_star_reviews),
      label: 'Five-Star Reviews',
    },
  ].filter((stat) => stat.value);

  const heroImage = products
    .map((product) => getProductPrimaryImage(product))
    .find(Boolean);

  const schema = [
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Bestsellers', path: '/bestsellers' },
    ]),
  ];

  return (
    <div className="bestsellers-shell min-h-screen bg-[var(--ds-surface-paper)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <section className="relative h-[480px] overflow-hidden bg-gradient-to-br from-[var(--ds-text-primary)] via-[var(--ds-text-secondary)] to-[var(--ds-text-secondary)]">
        {heroImage ? (
          <OptimizedImage
            src={heroImage}
            alt="Kvastram bestseller"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-black-rgb),0.3),rgba(var(--ds-black-rgb),0.5))]" />
        <div className="kv-page-container relative z-10 mx-auto flex h-full max-w-[1440px] flex-col items-center justify-center px-6 text-center text-[var(--ds-text-inverse)] md:px-12 lg:px-20">
          <h1 className="font-display text-display-xl type-regular leading-token-tight tracking-token-tight text-[var(--ds-text-inverse)]">
            Most <em className="italic">Loved</em>
          </h1>
          <p className="mt-4 max-w-[600px] font-display text-display-sm type-regular italic leading-token-relaxed text-[var(--ds-text-inverse)]/90">
            These are the pieces the Kavastram community can&apos;t stop talking about. Curated from thousands of orders and five-star reviews.
          </p>
        </div>
      </section>

      <div className="kv-page-container mx-auto max-w-[1440px] py-12 md:py-16 lg:py-24">
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-2 text-body-xs type-medium  tracking-token-wide text-[var(--ds-text-muted)]"
        >
          <Link href="/" className="transition-colors hover:text-[var(--ds-text-primary)]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--ds-text-secondary)]">Bestsellers</span>
        </nav>

        {stats.length > 0 ? (
          <section className="grid gap-0 border-b border-[var(--ds-border-subtle)] py-10 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border-r border-[var(--ds-border-subtle)] px-4 py-4 text-center last:border-r-0 sm:border-b sm:border-r xl:border-b-0"
              >
                <div className="font-display text-display-xl leading-token-tight text-[var(--ds-text-primary)]">
                  {stat.value}
                </div>
                <div className="mt-2 text-body-xs  tracking-token-wider text-[var(--ds-text-muted)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {sizes.length > 0 ? (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/bestsellers"
              className={`kv-text-chip px-4 py-2 text-body-xs type-medium  tracking-token-wider ${
                selectedSize === 'all' ? 'kv-text-chip--selected' : ''
              }`}
            >
              All Sizes
            </Link>
            {sizes.map((size) => (
              <Link
              key={size}
              href={`/bestsellers?size=${encodeURIComponent(size)}`}
              className={`kv-text-chip px-4 py-2 text-body-xs type-medium  tracking-token-wider ${
                selectedSize === size ? 'kv-text-chip--selected' : ''
              }`}
            >
              {size}
            </Link>
            ))}
          </div>
        ) : null}

        <section className="py-12 md:py-16 lg:py-24">
          {products.length > 0 ? (
            <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:gap-x-6 md:gap-y-12 xl:grid-cols-3 xl:gap-x-8 xl:gap-y-16">
              {products.map((product, index) => {
                const rating = product.avg_rating;
                const reviewCount = product.review_count;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.handle || product.id}`}
                    className="group block"
                  >
                    <div className="relative">
                      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--ds-surface-soft)]">
                        {getProductPrimaryImage(product) ? (
                          <OptimizedImage
                            src={getProductPrimaryImage(product) || ''}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : null}

                        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ds-text-primary)] font-display text-display-sm type-medium text-[var(--ds-text-inverse)]">
                          {index + 1}
                        </span>
                      </div>

                      <h2 className="mt-3 font-display text-display-sm type-medium leading-token-tight text-[var(--ds-text-primary)]">
                        {product.title}
                      </h2>
                      <PriceDisplay
                        as="p"
                        price={formatPrice(product)}
                        variant="compact"
                        className="mt-1"
                        priceClassName=" tracking-token-wider"
                      />

                      {rating && rating > 0 ? (
                        <RatingDisplay
                          rating={rating}
                          count={reviewCount}
                          className="mt-1  tracking-token-wide"
                          starSize={10}
                        />
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No bestselling products found right now."
              description="Check back soon for the pieces customers are loving most."
              className="my-12 md:my-16 lg:my-24"
            />
          )}
        </section>
      </div>

    </div>
  );
}
