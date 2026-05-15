import type { Metadata } from 'next';
import Link from 'next/link';

import { api } from '@/lib/api';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Artisans | Kvastram',
  description: 'Meet the Jaipur and Indian textile artisans behind Kvastram handmade block print, Kantha, and quilted cotton pieces.',
  path: '/artisans',
});

export default async function ArtisansPage() {
  const { artisans = [] } = await api.getArtisans();

  return (
    <main className="kv-container py-12 md:py-16 lg:py-20">
      <h1 className="collection-detail-title">Artisans</h1>
      <p className="collection-detail-copy mt-4 max-w-3xl">
        Kvastram works with textile artisans and small craft teams connected to Jaipur block printing, quilting, embroidery, and handmade cotton accessories.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {artisans.map((artisan: { id: string; name: string; slug: string; craft_specialty?: string }) => (
          <Link key={artisan.id} href={`/artisans/${artisan.slug}`} className="border border-stone-200 p-5 transition-colors hover:border-stone-900">
            <p className="collection-card-product-title">{artisan.name}</p>
            <p className="collection-detail-copy mt-2">{artisan.craft_specialty || 'Textile artisan'}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
