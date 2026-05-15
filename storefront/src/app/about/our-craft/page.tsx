import type { Metadata } from 'next';

import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Our Craft | Kvastram',
  description: 'Learn about Kvastram handmade textile craft, Jaipur block printing, quilting, and artisan-made cotton accessories.',
  path: '/about/our-craft',
});

export default function OurCraftPage() {
  return (
    <main className="kv-container py-12 md:py-16 lg:py-20">
      <h1 className="collection-detail-title">Our Craft</h1>
      <p className="collection-detail-copy mt-4 max-w-3xl">
        Kvastram pieces are shaped by handmade textile traditions: block printing, quilting, embroidery, careful finishing, and small-batch production.
      </p>
    </main>
  );
}
