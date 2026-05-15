import type { Metadata } from 'next';

import { buildBasicPageMetadata, buildSizeChartJsonLd, serializeJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Size Guide | Kvastram',
  description: 'Kvastram size guide for handcrafted clothing, jackets, and accessories with US, UK, EU, and India measurement references.',
  path: '/size-guide',
});

const rows = [
  ['XS', '0-2', '4-6', '30-32', '24-26'],
  ['S', '4-6', '8-10', '32-34', '26-28'],
  ['M', '8-10', '12-14', '34-36', '28-30'],
  ['L', '12-14', '16-18', '38-40', '32-34'],
  ['XL', '16-18', '20-22', '42-44', '36-38'],
];

export default function SizeGuidePage() {
  return (
    <main className="kv-container py-12 md:py-16 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildSizeChartJsonLd()) }}
      />
      <h1 className="collection-detail-title">Size Guide</h1>
      <p className="collection-detail-copy mt-4 max-w-3xl">
        Use these measurements as a starting point for Kvastram clothing and jacket sizing. Handmade pieces can vary slightly by fabric, cut, and quilting.
      </p>
      <div className="mt-8 overflow-x-auto border border-stone-200">
        <table className="size-guide-table">
          <thead className="size-guide-table-head">
            <tr>
              <th className="size-guide-table-heading py-3">Size</th>
              <th className="size-guide-table-heading py-3">US</th>
              <th className="size-guide-table-heading py-3">UK</th>
              <th className="size-guide-table-heading py-3">Bust (in)</th>
              <th className="size-guide-table-heading py-3">Waist (in)</th>
            </tr>
          </thead>
          <tbody className="size-guide-table-body">
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={cell} className="size-guide-table-size py-3">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
