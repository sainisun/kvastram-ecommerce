import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { api } from '@/lib/api';
import { buildBasicPageMetadata, buildPersonJsonLd, serializeJsonLd } from '@/lib/seo';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await api.getArtisan(slug);
  const artisan = data?.artisan;
  if (!artisan) return { title: 'Artisan Not Found', robots: { index: false, follow: false } };

  return buildBasicPageMetadata({
    title: `${artisan.name} | Kvastram Artisan`,
    description: artisan.bio || `${artisan.name} is connected to Kvastram handmade textile craft.`,
    path: `/artisans/${artisan.slug}`,
    image: artisan.image_url,
  });
}

export default async function ArtisanPage({ params }: Props) {
  const { slug } = await params;
  const data = await api.getArtisan(slug);
  if (!data?.artisan) notFound();

  const { artisan, products = [] } = data;

  return (
    <main className="kv-container py-12 md:py-16 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildPersonJsonLd(artisan)) }}
      />
      <h1 className="collection-detail-title">{artisan.name}</h1>
      <p className="collection-detail-copy mt-4 max-w-3xl">
        {artisan.bio || artisan.craft_specialty || 'Textile artisan connected to Kvastram handmade craft.'}
      </p>
      <div className="mt-6 grid gap-3 text-sm text-stone-600 md:grid-cols-2">
        <p><strong>Craft:</strong> {artisan.craft_specialty || 'Textile craft'}</p>
        <p><strong>Location:</strong> {artisan.location || 'India'}</p>
      </div>
      {products.length > 0 ? (
        <section className="mt-10">
          <h2 className="collection-section-title">Pieces by this artisan</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {products.map((product: { id: string; title: string; handle: string }) => (
              <Link key={product.id} href={`/products/${product.handle}`} className="border border-stone-200 p-5 transition-colors hover:border-stone-900">
                <p className="collection-card-product-title">{product.title}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
