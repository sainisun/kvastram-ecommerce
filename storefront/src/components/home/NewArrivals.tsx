'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import WishlistButton from '@/components/ui/WishlistButton';
import { useCurrency } from '@/context/currency-context';
import type { MoneyAmount, Product } from '@/types';

interface NewArrivalsProps {
  products: Product[];
  isCurated?: boolean;
}

export function NewArrivals({
  products,
  isCurated = false,
}: NewArrivalsProps) {
  const { formatPrice } = useCurrency();

  const displayed = products.slice(0, 4);
  if (displayed.length === 0) return null;

  function getPrice(product: Product): string {
    const prices = product.variants?.[0]?.prices;
    if (!prices?.length) return '';
    const inr =
      prices.find((p: MoneyAmount) => p.currency_code?.toLowerCase() === 'inr') ??
      prices[0];
    return formatPrice(inr.amount);
  }

  function getComparePrice(product: Product): string | null {
    const compareAt = product.variants?.[0]?.compare_at_price;
    return compareAt ? formatPrice(compareAt) : null;
  }

  return (
    <section className="bg-[#f6f1ea] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              {isCurated ? 'Featured Products' : 'New Arrivals'}
            </p>
            <h2 className="font-heading text-[32px] font-semibold leading-[0.98] text-stone-950 sm:text-[40px] lg:text-[48px]">
              {isCurated
                ? 'A handpicked edit for the homepage'
                : 'Fresh pieces, ready to discover'}
            </h2>
            <p className="max-w-2xl text-[15px] font-[300] leading-7 text-stone-600">
              {isCurated
                ? 'Using your existing featured-product wiring, this section elevates the current curated picks into a cleaner premium shopping grid.'
                : 'When featured products are not curated in admin, the homepage falls back to the newest live catalog items automatically.'}
            </p>
          </div>
          <Link
            href={isCurated ? '/products' : '/products?sort=newest'}
            className="inline-flex w-full items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-800 transition-colors hover:border-stone-950 hover:text-stone-950 sm:w-auto"
          >
            View All Products
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-4 md:gap-6">
          {displayed.map((product) => {
            const comparePrice = getComparePrice(product);
            const secondImage = product.images?.[1]?.url;

            return (
              <article key={product.id} className="group">
                <Link
                  href={`/products/${product.handle || product.id}`}
                  className="relative block aspect-[4/5] overflow-hidden rounded-[24px] bg-stone-100"
                >
                  {product.thumbnail ? (
                    <OptimizedImage
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-opacity duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-stone-200" />
                  )}
                  {secondImage ? (
                    <OptimizedImage
                      src={secondImage}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="absolute inset-0 object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    />
                  ) : null}
                  <div className="absolute right-3 top-3 z-10">
                    <WishlistButton
                      productId={product.id}
                      title={product.title}
                      price={product.variants?.[0]?.prices?.[0]?.amount || 0}
                      currency={
                        product.variants?.[0]?.prices?.[0]?.currency_code?.toUpperCase() ||
                        'INR'
                      }
                      thumbnail={product.thumbnail || undefined}
                      handle={product.handle || product.id}
                      variantId={product.variants?.[0]?.id}
                      size="sm"
                    />
                  </div>
                </Link>

                <div className="px-1 pt-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    {product.collection?.title || 'Kvastram'}
                  </p>
                  <Link
                    href={`/products/${product.handle || product.id}`}
                    className="mt-2 line-clamp-2 block text-[17px] font-semibold leading-snug text-stone-900 sm:text-[18px]"
                  >
                    {product.title}
                  </Link>
                  <div className="mt-3 flex items-center gap-2">
                    {comparePrice ? (
                      <span className="text-[13px] text-stone-400 line-through">
                        {comparePrice}
                      </span>
                    ) : null}
                    <span className="text-[16px] font-semibold text-stone-950">
                      {getPrice(product)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
