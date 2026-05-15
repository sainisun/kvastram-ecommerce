import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gift, Layers3, Sparkles, Tags, Wand2 } from 'lucide-react';

import { storefrontTrust } from '@/config/storefront-trust';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Curated Edits | Kvastram',
  description:
    'Browse curated Kvastram edits for gifting, bestsellers, new arrivals, block prints, sale picks, and collection-led discovery.',
  path: '/edits',
  keywords: [
    'Kvastram curated edits',
    'gift guide',
    'bestsellers',
    'block print edit',
  ],
});

const editCards = [
  {
    title: 'Gift Edit',
    copy:
      'Start with gift-friendly picks and easy browsing paths for thoughtful premium gifting.',
    href: '/collections/gifts-under-2000',
    icon: Gift,
    accent: 'from-[#7d3f25] via-[#a85d3a] to-[#d8b295]',
  },
  {
    title: 'Block Print Edit',
    copy:
      'Jump into handcrafted block-print styles instead of starting from the full catalog.',
    href: '/collections/block-print-edit',
    icon: Wand2,
    accent: 'from-[#3f5945] via-[#7a9b7f] to-[#d7dfd1]',
  },
  {
    title: 'Bestsellers',
    copy:
      'Browse the pieces that already carry the strongest shopper proof and repeat interest.',
    href: '/bestsellers',
    icon: Sparkles,
    accent: 'from-[#2c2c2c] via-[#6b6258] to-[#d8b295]',
  },
  {
    title: 'New Arrivals',
    copy:
      'See the freshest additions without having to build the right sort and filter combination yourself.',
    href: '/products?sort=newest',
    icon: Tags,
    accent: 'from-[#8b4d42] via-[#bd7a5a] to-[#f1ede7]',
  },
  {
    title: 'Collections',
    copy:
      'Explore story-led collection pages that behave more like curated rooms than a flat product listing.',
    href: '/collections',
    icon: Layers3,
    accent: 'from-[#59432e] via-[#8b6a49] to-[#f1ede7]',
  },
  {
    title: 'Sale Picks',
    copy:
      'Enter the current markdown layer quickly when you are shopping by value instead of collection.',
    href: '/sale',
    icon: ArrowRight,
    accent: 'from-[#5a2f2f] via-[#9a4d4d] to-[#f2d7d7]',
  },
];

export default function EditsPage() {
  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
            Guided Discovery
          </span>
          <h1 className="mt-4 font-serif text-display-xl text-stone-900">
            Curated Edits
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-stone-600">
            Use curated routes when you want a faster way into the storefront
            than broad search, generic filters, or starting from every product
            at once.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {editCards.map(({ title, copy, href, icon: Icon, accent }) => (
            <Link
              key={title}
              href={href}
              className="group block overflow-hidden border border-stone-200 bg-white transition-colors hover:border-stone-400"
            >
              <div className={`bg-gradient-to-br ${accent} p-6 text-white`}>
                <Icon size={28} />
                <h2 className="mt-12 text-display-sm font-serif">{title}</h2>
              </div>
              <div className="p-6">
                <p className="text-body-sm leading-token-relaxed text-stone-600">
                  {copy}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-body-xs type-bold uppercase tracking-token-wider text-stone-900">
                  Open Edit <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Link
            href="/products"
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Shop All
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.help}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Help Center
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.contact}
            className="bg-stone-900 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-white transition-colors hover:bg-stone-800"
          >
            Contact Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
