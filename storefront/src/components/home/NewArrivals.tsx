'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { MoneyAmount, Product } from '@/types';

interface NewArrivalsProps {
  products: Product[];
  isCurated?: boolean;
}

function formatPrice(product: Product): string {
  const prices = product.variants?.[0]?.prices;
  if (!prices?.length) return '';
  const inr =
    prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') ??
    prices[0];

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: inr.currency_code?.toUpperCase() || 'INR',
  }).format(inr.amount / 100);
}

export function NewArrivals({ products, isCurated = false }: NewArrivalsProps) {
  const displayed = products.slice(0, 4);
  if (displayed.length === 0) return null;

  return (
    <section className={isCurated ? 'bg-[#f6f1ea] py-16 sm:py-20' : 'bg-white py-16 sm:py-20'}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            New Arrivals
          </div>
          <h2 className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-medium leading-[0.96] tracking-[-0.02em] text-stone-950">
            Fresh pieces, ready to <em>discover</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {displayed.map((product) => {
            const secondImage = product.images?.[1]?.url;

            return (
              <article key={product.id} className="group">
                <Link
                  href={`/products/${product.handle || product.id}`}
                  className="relative block aspect-[4/5] overflow-hidden bg-stone-100"
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
                </Link>

                <div className="px-1 pt-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
                    {product.collection?.title || 'Kvastram'}
                  </p>
                  <Link
                    href={`/products/${product.handle || product.id}`}
                    className="mt-2 line-clamp-2 block font-body text-[15px] font-normal leading-[1.55] text-stone-900 sm:text-[16px]"
                  >
                    {product.title}
                  </Link>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-body text-[15px] font-normal text-stone-950">
                      {formatPrice(product)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={isCurated ? '/products' : '/products?sort=newest'}
            className="inline-flex items-center justify-center bg-stone-950 px-8 py-4 text-[12px] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-stone-800"
          >
            {isCurated ? 'View All Featured Products' : 'View All New Arrivals'}
            <ArrowRight size={14} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
