import type { Metadata } from 'next';

import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Block Printing | Kvastram',
  description: 'Learn how Jaipur block print traditions influence Kvastram handmade cotton bags, pouches, jackets, and accessories.',
  path: '/about/block-printing',
});

export default function BlockPrintingPage() {
  return (
    <main className="kv-container py-12 md:py-16 lg:py-20">
      <h1 className="collection-detail-title">Block Printing</h1>
      <p className="collection-detail-copy mt-4 max-w-3xl">
        Block printing uses carved wooden blocks, repeat placement, and layered color to create the textile patterns seen across many Kvastram pieces.
      </p>
    </main>
  );
}
