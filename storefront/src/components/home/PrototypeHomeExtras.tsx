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
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mb-8 grid gap-4 md:mb-12 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
          {eyebrow}
        </div>
        <h2 className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-medium leading-[0.96] text-stone-950">
          {title}
        </h2>
      </div>
      {copy ? <p className="max-w-xl text-[14px] leading-7 text-stone-600">{copy}</p> : null}
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center rounded-[8px] border border-stone-200 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-900 transition-colors hover:border-stone-900"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyMerchState({ label }: { label: string }) {
  return (
    <div className="rounded-[12px] border border-dashed border-stone-300 bg-white/70 px-6 py-10 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        {label}
      </p>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-stone-600">
        Add active homepage merchandising slots in admin to publish this section.
      </p>
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

function MerchSlotCard({ slot }: { slot: HomepageMerchandisingSlot }) {
  return (
    <Link
      href={slotHref(slot)}
      className="relative min-h-[320px] min-w-[78%] snap-start overflow-hidden rounded-[12px] bg-gradient-to-br from-[#7d3f25] via-[#a85d3a] to-[#d8b295] p-8 text-white sm:min-w-[42%] lg:min-w-[31%]"
    >
      {slot.image_url ? (
        <OptimizedImage
          src={slot.image_url}
          alt={slot.title}
          fill
          sizes="(max-width: 768px) 78vw, 31vw"
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.54))]" />
      <div className="relative z-10 flex h-full flex-col justify-end">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/75">
          {slot.eyebrow || 'Kvastram Edit'}
        </div>
        <h3 className="mt-3 font-heading text-[32px] leading-none">
          {slot.title}
        </h3>
        {slot.copy ? (
          <p className="mt-3 max-w-[18rem] text-[14px] leading-7 text-white/82">
            {slot.copy}
          </p>
        ) : null}
      </div>
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
        className="relative block aspect-[4/5] overflow-hidden rounded-[12px] bg-stone-100"
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
          <div className="flex h-full w-full items-center justify-center bg-[var(--soft)] text-[var(--muted)]">
            No Image
          </div>
        )}
      </Link>
      <Link
        href={`/products/${product.handle || product.id}`}
        className="mt-4 line-clamp-2 block text-[15px] leading-6 text-stone-950"
      >
        {product.title}
      </Link>
      <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-stone-500">
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
      <section className="bg-[#f8f1eb] py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <SectionHead
            eyebrow="Homepage merchandising"
            title="Seasonal edits"
            copy="Published from active homepage merchandising slots."
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

      <section className="bg-white py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <SectionHead
            eyebrow="Live catalog"
            title="Pieces we love"
            copy="Filled only from live newest, bestseller, and sale products."
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

      <section className="bg-[#f8f1eb] py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <SectionHead
            eyebrow="Live taxonomy"
            title="Shop by fabric"
            copy="Uses active merchandising slots first, then live backend tags."
          />
          {fabricCards.length > 0 ? (
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {fabricCards.map((slot) => (
                <MerchSlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          ) : (
            <EmptyMerchState label="No fabric edits live" />
          )}
        </div>
      </section>

      <section className="bg-[#f8f1eb] py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <SectionHead
            eyebrow="Live collections"
            title="Occasion finder"
            copy="Uses active merchandising slots first, then live collections."
          />
          {occasionCards.length > 0 ? (
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {occasionCards.map((slot) => (
                <MerchSlotCard key={slot.id} slot={slot} />
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
