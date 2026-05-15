import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { storefrontTrust } from '@/config/storefront-trust';
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

type StaticPolicyPageProps = {
  title: string;
  path: string;
  description: string;
  content: string;
};

export function StaticPolicyPage({
  title,
  path,
  description,
  content,
}: StaticPolicyPageProps) {
  const schema = [
    buildWebPageJsonLd({
      title,
      path,
      description,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: title, path },
    ]),
  ];

  return (
    <div className="min-h-screen bg-white pb-24 pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <div className="mx-auto max-w-4xl px-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-body-xs type-medium uppercase tracking-token-wide text-stone-400"
        >
          <Link href="/" className="transition-colors hover:text-stone-900">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-700">{title}</span>
        </nav>

        <h1 className="mb-10 text-center font-heading text-display-xl type-semibold uppercase tracking-token-wide text-stone-900 md:text-display-xl">
          {title}
        </h1>

        <div className="prose prose-stone prose-lg max-w-none type-light text-stone-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>

        <div className="mt-12 grid gap-4 border border-stone-200 bg-stone-50 p-6 md:grid-cols-3">
          <Link
            href={storefrontTrust.policyRoutes.help}
            className="border border-stone-300 bg-white px-6 py-4 text-center text-body-sm font-semibold uppercase tracking-[0.18em] text-stone-900 transition-colors hover:bg-stone-100"
          >
            Help Center
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.contact}
            className="border border-stone-300 bg-white px-6 py-4 text-center text-body-sm font-semibold uppercase tracking-[0.18em] text-stone-900 transition-colors hover:bg-stone-100"
          >
            Contact Support
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.track}
            className="border border-stone-300 bg-white px-6 py-4 text-center text-body-sm font-semibold uppercase tracking-[0.18em] text-stone-900 transition-colors hover:bg-stone-100"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}
