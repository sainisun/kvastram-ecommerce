import type { Metadata } from 'next';

import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Kantha Craft | Kvastram',
  description: 'A short guide to Kantha-inspired quilting and stitched textile craft in Kvastram handmade pieces.',
  path: '/about/kantha',
});

export default function KanthaPage() {
  return (
    <main className="kv-container py-12 md:py-16 lg:py-20">
      <h1 className="collection-detail-title">Kantha Craft</h1>
      <p className="collection-detail-copy mt-4 max-w-3xl">
        Kantha is known for visible stitch texture, layered fabric, and a human rhythm that machine-perfect surfaces cannot reproduce.
      </p>
    </main>
  );
}
