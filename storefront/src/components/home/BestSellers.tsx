import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { Product } from '@/types';

interface BestSellersProps {
  products: Product[];
}

function formatPrice(product: Product): string {
  const price = product.variants?.[0]?.prices?.[0];
  if (!price) return '';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: price.currency_code?.toUpperCase() || 'INR',
  }).format(price.amount / 100);
}

export function BestSellers({ products }: BestSellersProps) {
  const curated = products.slice(4, 8);
  const displayed = curated.length > 0 ? curated : products.slice(0, 4);
  if (displayed.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            Most Loved
          </div>
          <h2 className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-medium leading-[0.96] tracking-[-0.02em] text-stone-950">
            Our <em>Bestsellers</em>
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-stone-600">
            Pieces the Kavastram community can&apos;t stop talking about
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {displayed.map((product) => (
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
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-stone-200" />
                )}
              </Link>

              <div className="px-1 pt-4">
                <Link
                  href={`/products/${product.handle || product.id}`}
                  className="line-clamp-2 block text-[17px] font-semibold leading-snug text-stone-900 sm:text-[18px]"
                >
                  {product.title}
                </Link>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[16px] font-semibold text-stone-950">
                    {formatPrice(product)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/bestsellers"
            className="inline-flex items-center justify-center bg-stone-950 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-stone-800"
          >
            View All Bestsellers
          </Link>
        </div>
      </div>
    </section>
  );
}
