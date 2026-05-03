import type { Metadata } from 'next';
import Link from 'next/link';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';
import { formatPriceFromINR } from '@/lib/currency';
import {
  buildBasicPageMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from '@/lib/seo';
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

function renderStars(rating?: number | null) {
  const filled = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return Array.from({ length: 5 }, (_, index) => (
    <svg
      key={index}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill={index < filled ? '#080808' : '#ddd'}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ));
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
      ? (curatedResult.value.featuredProducts || [])
          .map((item: { product?: Product | null }) => item.product)
          .filter((product: Product | null | undefined): product is Product =>
            Boolean(product?.id)
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
      ? taggedProductsResult.value.products || []
      : [];
  const fallbackProducts =
    fallbackProductsResult.status === 'fulfilled'
      ? fallbackProductsResult.value.products || []
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

  const heroImage = products.find((product) => product.thumbnail)?.thumbnail;

  const schema = [
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Bestsellers', path: '/bestsellers' },
    ]),
  ];

  return (
    <div className="bestsellers-shell min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <section className="relative h-[480px] overflow-hidden bg-gradient-to-br from-stone-950 via-stone-800 to-stone-700">
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
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.5))]" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col items-center justify-center px-6 text-center text-white md:px-12 lg:px-20">
          <h1 className="font-heading text-[clamp(48px,6vw,76px)] font-normal leading-none tracking-[-0.03em] text-white">
            Most <em className="italic">Loved</em>
          </h1>
          <p className="mt-4 max-w-[600px] font-heading text-[18px] font-normal italic leading-8 text-white/90">
            These are the pieces the Kavastram community can&apos;t stop talking about. Curated from thousands of orders and five-star reviews.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400"
        >
          <Link href="/" className="transition-colors hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-700">Bestsellers</span>
        </nav>

        {stats.length > 0 ? (
          <section className="grid gap-0 border-b border-stone-100 py-10 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border-r border-stone-100 px-4 py-4 text-center last:border-r-0 sm:border-b sm:border-r xl:border-b-0"
              >
                <div className="font-heading text-[clamp(28px,3vw,42px)] leading-none text-stone-950">
                  {stat.value}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">
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
              className={`inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                selectedSize === 'all'
                  ? 'border-stone-950 bg-stone-950 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'
              }`}
            >
              All Sizes
            </Link>
            {sizes.map((size) => (
              <Link
                key={size}
                href={`/bestsellers?size=${encodeURIComponent(size)}`}
                className={`inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                  selectedSize === size
                    ? 'border-stone-950 bg-stone-950 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'
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
                      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                        {product.thumbnail ? (
                          <OptimizedImage
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-stone-200">
                            <span className="font-heading text-3xl font-semibold uppercase tracking-[0.02em] text-stone-400">
                              {product.title}
                            </span>
                          </div>
                        )}

                        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-stone-950 font-heading text-[18px] font-medium text-white">
                          {index + 1}
                        </span>
                      </div>

                      <h2 className="mt-3 font-heading text-[20px] font-medium leading-tight text-stone-950">
                        {product.title}
                      </h2>
                      <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-stone-500">
                        {formatPrice(product)}
                      </p>

                      {rating && rating > 0 ? (
                        <div className="mt-1 flex items-center gap-1 text-[12px] uppercase tracking-[0.05em] text-stone-500">
                          <span className="flex items-center gap-0.5 text-stone-900">
                            {renderStars(rating)}
                          </span>
                          {reviewCount && reviewCount > 0 ? (
                            <span>{rating.toFixed(1)} ({reviewCount} reviews)</span>
                          ) : (
                            <span>{rating.toFixed(1)}</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center md:py-16 lg:py-24">
              <p className="text-lg text-stone-500">
                No bestselling products found right now.
              </p>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
