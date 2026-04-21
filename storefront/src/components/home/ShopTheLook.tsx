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

  const fallbackProducts = [
    { title: 'Aaroh Supima Cotton Kurta', price: '₹ 10,900' },
    { title: 'Cotton Pant — Off White', price: '₹ 4,200' },
    { title: 'Organza Dupatta — Embroidered', price: '₹ 6,800' },
  ];

  const items = spotlightProducts.slice(0, 3).map((item, index) => ({
    id: item.id,
    product: item.product,
    image:
      cloudinaryUrlOrNull(item.custom_image_url) ||
      cloudinaryUrlOrNull(item.product.thumbnail) ||
      '/images/home/atelier-story.jpg',
    fallback: fallbackProducts[index],
  }));

  const heroImage = items[0]?.image || '/images/home/atelier-story.jpg';
  const productHref = (index: number) =>
    `/products/${items[index]?.product.handle || items[index]?.product.id || ''}`.replace(
      /\/$/,
      '/products'
    );

  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 text-center">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            Style Story
          </div>
          <h2 className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-medium leading-[0.96] tracking-[-0.02em] text-stone-950">
            Shop the <em className="italic">Look</em>
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.4fr,1fr] lg:items-center">
          <div className="relative overflow-hidden">
            <div className="relative aspect-[4/5] bg-stone-100">
              <OptimizedImage
                src={heroImage}
                alt={items[0]?.product.title || 'Full look'}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.16),transparent_55%)]" />
              <Link
                href={productHref(0)}
                className="absolute top-[20%] left-[45%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/90"
                aria-label={items[0]?.product.title || 'Hotspot product 1'}
              />
              <Link
                href={productHref(1)}
                className="absolute top-[55%] left-[42%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/90"
                aria-label={items[1]?.product.title || 'Hotspot product 2'}
              />
              <Link
                href={productHref(2)}
                className="absolute top-[32%] left-[58%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/90"
                aria-label={items[2]?.product.title || 'Hotspot product 3'}
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className="text-[12px] uppercase tracking-[0.2em] text-stone-500">
              Look 01 / 03
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

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-b border-stone-200 pb-4"
                  >
                    <Link
                      href={`/products/${item.product.handle || item.product.id || ''}`.replace(
                        /\/$/,
                        '/products'
                      )}
                      className="relative h-20 w-16 shrink-0 overflow-hidden bg-stone-100"
                    >
                      <OptimizedImage
                        src={item.image}
                        alt={item.product.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-[13px] font-medium text-stone-950">
                        {item.product.title || item.fallback.title}
                      </h4>
                      <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-stone-500">
                        {price ? formatCurrency(price.amount, price.currency_code) : item.fallback.price}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="h-10 w-10 border border-stone-300 text-[18px] leading-none text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
                      aria-label={`Add ${item.product.title || item.fallback.title}`}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>

            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-stone-950 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-stone-800"
            >
              Shop Complete Look — ₹21,900
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
