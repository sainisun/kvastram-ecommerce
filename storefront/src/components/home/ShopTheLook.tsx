import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageSpotlightProduct } from '@/types/homepage';
import { cloudinaryUrlOrNull } from '@/lib/media';

interface ShopTheLookProps {
  spotlightProducts: HomepageSpotlightProduct[];
}

function formatCurrency(amount?: number, currencyCode = 'INR') {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export function ShopTheLook({ spotlightProducts }: ShopTheLookProps) {
  if (spotlightProducts.length === 0) return null;

  const items = spotlightProducts
    .map((item) => ({
      id: item.id,
      product: item.product,
      image:
        cloudinaryUrlOrNull(item.custom_image_url) ||
        cloudinaryUrlOrNull(item.product.thumbnail),
    }))
    .filter((item) => Boolean(item.product?.id && item.product?.title && item.image))
    .slice(0, 3);

  if (items.length === 0) return null;

  const productHref = (index: number) =>
    `/products/${items[index]?.product.handle || items[index]?.product.id || ''}`.replace(
      /\/$/,
      '/products'
    );

  return (
    <section className="bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <div className="mb-8 text-center md:mb-12">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            Style Story
          </div>
          <h2 className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-medium leading-[0.96] tracking-[-0.02em] text-stone-950">
            Shop the <em className="italic">Look</em>
          </h2>
        </div>

        <div className="grid gap-8 md:gap-12 lg:grid-cols-[1.4fr,1fr] lg:items-center lg:gap-16">
          <div className="relative overflow-hidden">
            <div className="relative aspect-[4/5] bg-stone-100">
              <OptimizedImage
                src={items[0].image || ''}
                alt={items[0].product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.16),transparent_55%)]" />
              {items.map((item, index) => (
                <Link
                  key={item.id}
                  href={productHref(index)}
                  className={[
                    'absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/90',
                    index === 0 ? 'left-[45%] top-[20%]' : '',
                    index === 1 ? 'left-[42%] top-[55%]' : '',
                    index === 2 ? 'left-[58%] top-[32%]' : '',
                  ].join(' ')}
                  aria-label={item.product.title}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-[12px] uppercase tracking-[0.2em] text-stone-500">
              Look 01 / {String(items.length).padStart(2, '0')}
            </div>
            <h3 className="font-heading text-[clamp(28px,3vw,42px)] font-medium leading-[0.96] tracking-[-0.03em] text-stone-950">
              The Festive <em className="italic">Look</em>
            </h3>
            <p className="max-w-xl text-[14px] leading-7 text-stone-600">
              Tap any hotspot to explore, or shop the complete look below.
            </p>

            <div className="space-y-4">
              {items.map((item) => {
                const price = item.product.variants?.[0]?.prices?.[0];
                const href = `/products/${item.product.handle || item.product.id}`;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-b border-stone-200 pb-4"
                  >
                    <Link
                      href={href}
                      className="relative h-20 w-16 shrink-0 overflow-hidden bg-stone-100"
                    >
                      <OptimizedImage
                        src={item.image || ''}
                        alt={item.product.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-[13px] font-medium text-stone-950">
                        {item.product.title}
                      </h4>
                      {price ? (
                        <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-stone-500">
                          {formatCurrency(price.amount, price.currency_code)}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={href}
                      className="flex h-10 w-10 items-center justify-center border border-stone-300 text-[18px] leading-none text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
                      aria-label={`View ${item.product.title}`}
                    >
                      +
                    </Link>
                  </div>
                );
              })}
            </div>

            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-stone-950 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-stone-800"
            >
              Shop Complete Look
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
