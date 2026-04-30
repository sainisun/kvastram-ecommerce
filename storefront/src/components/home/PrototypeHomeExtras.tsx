'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { MoneyAmount, Product } from '@/types';
import type { HomepageCollection } from '@/types/homepage';
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
}

const campaignPlaceholders = [
  {
    eyebrow: 'Summer craft',
    title: 'Lightweight Kantha Layers',
    copy: 'Breathable cottons for rituals, brunches, and warm evenings.',
    href: '/products',
    className: 'from-[#a85d3a] to-[#c4956a]',
  },
  {
    eyebrow: 'New launch',
    title: 'Block Print Classics',
    copy: 'Everyday sets with Jaipur-inspired print stories.',
    href: '/products',
    className: 'from-[#174f70] to-[#7a9b7f]',
  },
  {
    eyebrow: 'Occasion edit',
    title: 'Wedding Guest Ready',
    copy: 'Sarees, accessories, and occasion-ready craft pieces.',
    href: '/collections',
    className: 'from-[#7f1d1d] to-[#c4956a]',
  },
];

const fabricNames = ['Cotton', 'Silk', 'Wool', 'Handloom', 'Block Print', 'Embroidery'];
const occasionPlaceholders = [
  'Haldi & Mehendi',
  'Workday Craft',
  'Gifting Under Rs. 2000',
];

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

function ProductTile({
  product,
  placeholder,
}: {
  product?: Product;
  placeholder: string;
}) {
  const { formatPrice } = useCurrency();
  const href = product ? `/products/${product.handle || product.id}` : '/products';
  const title = product?.title || placeholder;
  const price = product ? getPrice(product) : 0;

  return (
    <article className="group">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-stone-100">
        {product?.thumbnail ? (
          <OptimizedImage
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f4d4b8] to-[#a85d3a] font-heading text-[64px] text-white/80">
            {title.charAt(0)}
          </div>
        )}
      </Link>
      <Link
        href={href}
        className="mt-4 line-clamp-2 block text-[15px] leading-6 text-stone-950"
      >
        {title}
      </Link>
      <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-stone-500">
        {price ? formatPrice(price) : 'Placeholder edit'}
      </p>
    </article>
  );
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
        <h2 className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-medium leading-[0.96] tracking-[-0.02em] text-stone-950">
          {title}
        </h2>
      </div>
      {copy ? <p className="max-w-xl text-[14px] leading-7 text-stone-600">{copy}</p> : null}
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center border border-stone-200 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-900 transition-colors hover:border-stone-900"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function PrototypeHomeExtras({
  products,
  bestsellerProducts,
  collections,
  tags,
}: PrototypeHomeExtrasProps) {
  const saleProducts = products.filter(isSaleProduct);
  const tabProducts = [
    ...products.slice(0, 2),
    ...bestsellerProducts.slice(0, 1),
    ...saleProducts.slice(0, 1),
  ].slice(0, 4);

  const fabricTags = tags
    .filter((tag) =>
      fabricNames.some((name) => tag.name.toLowerCase().includes(name.toLowerCase()))
    )
    .slice(0, 6);
  const fabricCards =
    fabricTags.length > 0
      ? fabricTags.map((tag) => ({
          label: tag.name,
          href: `/products?tag_id=${encodeURIComponent(tag.id)}`,
        }))
      : fabricNames.slice(0, 3).map((name) => ({
          label: name,
          href: '/products',
        }));

  const occasionCards =
    collections.length > 0
      ? collections.slice(0, 3).map((collection) => ({
          label: collection.title,
          href: `/collections/${collection.handle}`,
        }))
      : occasionPlaceholders.map((label) => ({
          label,
          href: '/collections',
        }));

  return (
    <>
      <section className="bg-[#f8f1eb] py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <SectionHead
            eyebrow="Extra section"
            title="Seasonal edits"
            copy="Prototype-inspired campaign rail. Real links are used where matching catalog data exists; otherwise it stays as a visual merchandising placeholder."
          />
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {campaignPlaceholders.map((campaign) => (
              <Link
                key={campaign.title}
                href={campaign.href}
                className={`relative min-h-[320px] min-w-[78%] snap-start overflow-hidden bg-gradient-to-br p-8 text-white sm:min-w-[42%] lg:min-w-[31%] ${campaign.className}`}
              >
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 flex h-full flex-col justify-end">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/75">
                    {campaign.eyebrow}
                  </div>
                  <h3 className="mt-3 font-heading text-[32px] leading-none">
                    {campaign.title}
                  </h3>
                  <p className="mt-3 max-w-[18rem] text-[14px] leading-7 text-white/80">
                    {campaign.copy}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <SectionHead
            eyebrow="Extra section"
            title="Pieces we love"
            copy="Tabbed-product direction from the prototype, filled with newest, bestseller, and sale products when the live catalog has them."
          />
          <div className="mb-8 flex flex-wrap gap-2">
            {['New Arrivals', 'Bestsellers', 'On Sale'].map((label, index) => (
              <span
                key={label}
                className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  index === 0
                    ? 'border-stone-950 bg-stone-950 text-white'
                    : 'border-stone-200 bg-white text-stone-700'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-12 lg:gap-x-8">
            {[0, 1, 2, 3].map((index) => (
              <ProductTile
                key={tabProducts[index]?.id || `placeholder-product-${index}`}
                product={tabProducts[index]}
                placeholder={
                  ['Handwoven Kantha Dupatta', 'Indigo Block Print Kurta', 'Rajasthani Saree', 'Zardozi Potli Bag'][index]
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f1eb] py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <SectionHead
            eyebrow="Extra section"
            title="Shop by fabric"
            copy="Uses admin tags when fabric/craft tags exist; otherwise it preserves the prototype layout with placeholder fabric cards."
          />
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {fabricCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="min-w-[72%] snap-start border border-stone-200 bg-white p-6 transition-colors hover:border-stone-900 sm:min-w-[36%] lg:min-w-[24%]"
              >
                <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                  {card.label}
                </div>
                <h3 className="mt-4 font-heading text-[28px] leading-none text-stone-950">
                  {card.label === 'Cotton'
                    ? 'Everyday breathable'
                    : card.label === 'Silk'
                      ? 'Festive drape'
                      : card.label === 'Wool'
                        ? 'Shawl season'
                        : 'Craft-led edit'}
                </h3>
                <p className="mt-3 text-[14px] leading-7 text-stone-600">
                  Browse live products when this taxonomy is available.
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f1eb] py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <SectionHead
            eyebrow="Extra section"
            title="Occasion finder"
            copy="Collection-backed when real collections exist, placeholder-backed when the occasion taxonomy still needs admin support."
          />
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {occasionCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="min-w-[78%] snap-start border border-stone-200 bg-white p-6 transition-colors hover:border-stone-900 sm:min-w-[42%] lg:min-w-[31%]"
              >
                <h3 className="font-heading text-[30px] leading-none text-stone-950">
                  {card.label}
                </h3>
                <p className="mt-4 text-[14px] leading-7 text-stone-600">
                  Light, joyful, movement-friendly pieces for the moment.
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
