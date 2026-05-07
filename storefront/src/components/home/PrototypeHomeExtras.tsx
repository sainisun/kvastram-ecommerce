'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { MoneyAmount, Product } from '@/types';
import type {
  HomepageCollection,
  HomepageMerchandisingSlot,
} from '@/types/homepage';
import { useCurrency } from '@/context/currency-context';

interface Tag {
  id: string;
  name: string;
}

interface PrototypeHomeExtrasProps {
  products: Product[];
  bestsellerProducts: Product[];
  collections: HomepageCollection[];
  tags: Tag[];
  merchandisingSlots: HomepageMerchandisingSlot[];
  children?: ReactNode;
}

function getPrice(product: Product) {
  const prices = product.variants?.[0]?.prices || [];
  const inr =
    prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') ||
    prices[0];
  return inr?.amount || 0;
}

function isSaleProduct(product: Product) {
  const currentPrice = getPrice(product);
  const compareAt = product.variants?.[0]?.compare_at_price || 0;
  return compareAt > currentPrice && currentPrice > 0;
}

function SectionHead({
  eyebrow,
  action,
}: {
  eyebrow: string;
  copy?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="kv-section-head mb-8 md:mb-12">
      <div className="kv-tag">{eyebrow}</div>
      {action ? (
        <Link href={action.href} className="kv-section-link">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyMerchState({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] bg-white px-6 py-10 text-center">
      <p className="kv-tag">{label}</p>
    </div>
  );
}

function slotHref(slot: HomepageMerchandisingSlot) {
  if (slot.link_url) return slot.link_url;
  if (slot.linked_product_id) return `/products/${slot.linked_product_id}`;
  if (slot.linked_collection_id) return `/products?collection_id=${slot.linked_collection_id}`;
  if (slot.linked_category_id) return `/products?category_id=${slot.linked_category_id}`;
  if (slot.linked_tag_id) return `/products?tag_id=${slot.linked_tag_id}`;
  return '/products';
}

type MerchSlotCardVariant = 'default' | 'categoryOverlay';

function MerchSlotCard({
  slot,
  variant = 'default',
}: {
  slot: HomepageMerchandisingSlot;
  variant?: MerchSlotCardVariant;
}) {
  const isCategoryOverlay = variant === 'categoryOverlay';
  const cardClassName = isCategoryOverlay
    ? 'homepage-category-merch-card group'
    : 'relative min-h-[320px] min-w-[78%] snap-start overflow-hidden rounded-lg bg-gradient-to-br from-[#7d3f25] via-[#a85d3a] to-[#d8b295] p-8 text-white sm:min-w-[42%] lg:min-w-[31%]';
  const imageSizes = isCategoryOverlay
    ? '(max-width: 740px) 80vw, (max-width: 999px) 60vw, 23vw'
    : '(max-width: 768px) 78vw, 31vw';

  return (
    <Link
      href={slotHref(slot)}
      className={cardClassName}
    >
      {slot.image_url ? (
        <OptimizedImage
          src={slot.image_url}
          alt={slot.title}
          fill
          sizes={imageSizes}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : null}

      {isCategoryOverlay ? (
        <div className="homepage-category-merch-info">
          <h3>{slot.title}</h3>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.54))]" />
          <div className="relative z-10 flex h-full flex-col justify-end">
            <div className="text-body-xs uppercase tracking-token-wider text-white/75">
              {slot.eyebrow || 'Kvastram Edit'}
            </div>
            <h3 className="mt-3 font-heading text-display-md leading-token-tight">
              {slot.title}
            </h3>
            {slot.copy ? (
              <p className="mt-3 max-w-[18rem] text-body-sm leading-7 text-white/82">
                {slot.copy}
              </p>
            ) : null}
          </div>
        </>
      )}
    </Link>
  );
}

function ProductTile({ product }: { product: Product }) {
  const { formatPrice } = useCurrency();
  const price = getPrice(product);

  return (
    <article className="group">
      <Link
        href={`/products/${product.handle || product.id}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-lg bg-stone-100"
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
          <div className="flex h-full w-full items-center justify-center bg-[var(--soft)] color-muted">
            No Image
          </div>
        )}
      </Link>
      <Link
        href={`/products/${product.handle || product.id}`}
        className="mt-4 line-clamp-2 block text-body-md leading-6 color-ink"
      >
        {product.title}
      </Link>
      <p className="mt-1 text-body-xs uppercase tracking-token-wider color-muted">
        {price ? formatPrice(price) : 'Contact for price'}
      </p>
    </article>
  );
}

function groupSlots(slots: HomepageMerchandisingSlot[], key: string) {
  return slots
    .filter((slot) => slot.slot_key === key && slot.is_active)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export function PrototypeHomeExtras({
  products,
  bestsellerProducts,
  collections,
  tags,
  merchandisingSlots,
  children,
}: PrototypeHomeExtrasProps) {
  const seasonalSlots = groupSlots(merchandisingSlots, 'seasonal_edits');
  const fabricSlots = groupSlots(merchandisingSlots, 'fabric_edits');
  const occasionSlots = groupSlots(merchandisingSlots, 'occasion_edits');
  const saleProducts = products.filter(isSaleProduct);
  const tabProducts = [
    ...products.slice(0, 2),
    ...bestsellerProducts.slice(0, 1),
    ...saleProducts.slice(0, 1),
  ].slice(0, 4);

  const fabricCards =
    fabricSlots.length > 0
      ? fabricSlots
      : tags.slice(0, 6).map((tag, index) => ({
          id: tag.id,
          slot_key: 'fabric_edits',
          title: tag.name,
          eyebrow: 'Fabric',
          copy: 'Browse live products tagged with this fabric or craft.',
          link_url: `/products?tag_id=${encodeURIComponent(tag.id)}`,
          is_active: true,
          sort_order: index,
        }));

  const occasionCards =
    occasionSlots.length > 0
      ? occasionSlots
      : collections.slice(0, 3).map((collection, index) => ({
          id: collection.id,
          slot_key: 'occasion_edits',
          title: collection.title,
          eyebrow: 'Occasion',
          copy: 'Explore this live collection edit.',
          link_url: `/collections/${collection.handle}`,
          image_url: collection.image,
          is_active: true,
          sort_order: index,
        }));

  return (
    <>
      <section className="kv-section bg-[var(--cream)]">
        <div className="kv-container">
          <SectionHead
            eyebrow="Limited editions"
            action={{ label: 'View All', href: '/products' }}
          />
          {seasonalSlots.length > 0 ? (
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {seasonalSlots.map((slot) => (
                <MerchSlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          ) : (
            <EmptyMerchState label="No seasonal edits live" />
          )}
        </div>
      </section>

      <section className="kv-section bg-white">
        <div className="kv-container">
          <SectionHead
            eyebrow="Curated for you"
            action={{ label: 'View All', href: '/products' }}
          />
          {tabProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-12 lg:gap-x-8">
              {tabProducts.map((product) => (
                <ProductTile key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyMerchState label="No live products available" />
          )}
        </div>
      </section>

      {children}

      <section className="kv-section bg-[var(--cream)]">
        <div className="kv-container">
          <SectionHead
            eyebrow="Craft &amp; material"
            action={{ label: 'View All', href: '/products' }}
          />
          {fabricCards.length > 0 ? (
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {fabricCards.map((slot) => (
                <MerchSlotCard
                  key={slot.id}
                  slot={slot}
                  variant="categoryOverlay"
                />
              ))}
            </div>
          ) : (
            <EmptyMerchState label="No fabric edits live" />
          )}
        </div>
      </section>

      <section className="kv-section bg-[var(--cream)]">
        <div className="kv-container">
          <SectionHead
            eyebrow="Dress for the moment"
            action={{ label: 'View All', href: '/collections' }}
          />
          {occasionCards.length > 0 ? (
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {occasionCards.map((slot) => (
                <MerchSlotCard
                  key={slot.id}
                  slot={slot}
                  variant="categoryOverlay"
                />
              ))}
            </div>
          ) : (
            <EmptyMerchState label="No occasion edits live" />
          )}
        </div>
      </section>
    </>
  );
}

