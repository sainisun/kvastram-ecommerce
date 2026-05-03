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
    <section className="kv-section bg-white">
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">Style Story</div>
            <h2 className="kv-title">Shop the <em className="italic">Look</em></h2>
          </div>
        </div>

        <div className="grid gap-8 md:gap-12 lg:grid-cols-[1.4fr,1fr] lg:items-center lg:gap-16">
          <div className="relative overflow-hidden">
            <div className="relative aspect-[4/5] bg-[var(--soft)]">
              <OptimizedImage
                src={items[0].image || ''}
                alt={items[0].product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
            <div className="kv-tag color-muted">
              Look 01 / {String(items.length).padStart(2, '0')}
            </div>
            <h3 className="kv-title text-display-xl">
              The Festive <em className="italic">Look</em>
            </h3>
            <p className="kv-sub">
              Tap any hotspot to explore, or shop the complete look below.
            </p>

            <div className="space-y-4">
              {items.map((item) => {
                const price = item.product.variants?.[0]?.prices?.[0];
                const href = `/products/${item.product.handle || item.product.id}`;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-b border-[var(--line)] pb-4"
                  >
                    <Link
                      href={href}
                      className="relative h-20 w-16 shrink-0 overflow-hidden bg-[var(--soft)]"
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
                      <h4 className="line-clamp-1 text-body-sm type-medium color-ink">
                        {item.product.title}
                      </h4>
                      {price ? (
                        <p className="mt-1 text-body-xs uppercase tracking-token-wider color-muted">
                          {formatCurrency(price.amount, price.currency_code)}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={href}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-body-lg leading-token-tight color-ink transition-colors hover:border-[var(--sienna)] hover:bg-[var(--sienna)] hover:text-white"
                      aria-label={`View ${item.product.title}`}
                    >
                      +
                    </Link>
                  </div>
                );
              })}
            </div>

            <Link href="/products" className="kv-btn kv-btn-primary">
              Shop Complete Look
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

