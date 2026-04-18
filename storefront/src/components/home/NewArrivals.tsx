'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const railRef = useRef<HTMLDivElement | null>(null);

  const displayed = products.slice(0, 8);
  if (displayed.length === 0) return null;

  function scrollRail(direction: 'left' | 'right') {
    if (!railRef.current) return;
    const amount = direction === 'left' ? -320 : 320;
    railRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  }

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
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              {isCurated ? 'Featured Products' : 'New Arrivals'}
            </p>
            <h2 className="mt-2 font-heading text-[30px] font-semibold leading-none text-stone-950 sm:text-[38px]">
              {isCurated
                ? 'Featured Products'
                : 'Fresh pieces, ready to discover'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => scrollRail('left')}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-950 hover:text-stone-950 md:inline-flex"
              aria-label="Scroll products left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollRail('right')}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-950 hover:text-stone-950 md:inline-flex"
              aria-label="Scroll products right"
            >
              <ChevronRight size={18} />
            </button>
            <Link
              href={isCurated ? '/products' : '/products?sort=newest'}
              className="inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:text-stone-950"
            >
              View All
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div
          ref={railRef}
          className="flex gap-5 overflow-x-auto pb-2 scroll-smooth no-scrollbar snap-x snap-mandatory"
        >
          {displayed.map((product) => {
            const comparePrice = getComparePrice(product);
            const secondImage = product.images?.[1]?.url;

            return (
              <article
                key={product.id}
                className="group w-[74vw] shrink-0 snap-start min-[480px]:w-[44vw] sm:w-[280px] lg:w-[300px]"
              >
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
