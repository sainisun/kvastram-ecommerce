import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { api } from '@/lib/api';
import {
  buildBasicPageMetadata,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { page } = await api.getPage(slug);
    const title = page.seo_title || page.title;
    const description =
      page.seo_description ||
      `Explore ${page.title} at Kvastram for customer support, policy details, and brand information.`;

    return buildBasicPageMetadata({
      title: `${title} | Kvastram`,
      description,
      path: `/pages/${slug}`,
      keywords: [page.title, 'Kvastram'],
    });
  } catch {
    return {
      title: 'Page Not Found',
      robots: { index: false, follow: false },
    };
  }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;

  let page;
  try {
    const data = await api.getPage(slug);
    page = data.page;
  } catch {
    notFound();
  }

  const schema = [
    buildWebPageJsonLd({
      title: page.title,
      path: `/pages/${slug}`,
      description:
        page.seo_description ||
        `Explore ${page.title} at Kvastram for policies, support information, and brand guidance.`,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: page.title, path: `/pages/${slug}` },
    ]),
  ];

  return (
    <div className="min-h-screen bg-white pb-24 pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(schema),
        }}
      />

      <div className="mx-auto max-w-4xl px-6">
        <nav
          aria-label="Breadcrumb"
          className="font-body mb-8 flex items-center gap-2 text-body-xs type-medium uppercase tracking-token-wide text-stone-400"
        >
          <Link href="/" className="transition-colors hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-700">{page.title}</span>
        </nav>

        <h1 className="mb-12 text-center font-heading text-display-xl type-semibold uppercase tracking-token-wide text-stone-900 md:text-display-xl">
          {page.title}
        </h1>
        <div
          className="prose prose-stone prose-lg max-w-none type-light text-stone-800"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}
