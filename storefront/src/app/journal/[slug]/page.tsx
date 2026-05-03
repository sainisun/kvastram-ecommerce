import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { post } = await api.getPost(slug);
    return buildArticleMetadata({
      title: `${post.seo_title || post.title} | Kvastram Journal`,
      description:
        post.seo_description ||
        post.excerpt ||
        `Read ${post.title} on the Kvastram Journal.`,
      path: `/journal/${slug}`,
      image: post.cover_image,
      keywords: post.seo_keywords
        ? post.seo_keywords.split(',').map((value: string) => value.trim())
        : [post.title, 'Kvastram Journal'],
    });
  } catch {
    return {
      title: 'Article Not Found',
      robots: { index: false, follow: false },
    };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    const data = await api.getPost(slug);
    post = data.post;
  } catch {
    notFound();
  }

  const schema = [
    buildArticleJsonLd({
      title: post.title,
      path: `/journal/${slug}`,
      description:
        post.seo_description ||
        post.excerpt ||
        `Read ${post.title} on the Kvastram Journal.`,
      image: post.cover_image,
      publishedAt: post.published_at,
      updatedAt: post.updated_at || post.published_at,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Journal', path: '/journal' },
      { name: post.title, path: `/journal/${slug}` },
    ]),
  ];

  return (
    <article className="min-h-screen bg-white pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(schema),
        }}
      />

      <div className="relative h-[60vh] text-white">
        {post.cover_image ? (
          <div className="absolute inset-0">
            <OptimizedImage
              src={post.cover_image}
              alt={`${post.title} - Kvastram Journal`}
              fill
              priority
              className="object-cover brightness-[0.85]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-stone-900" />
        )}

        <div className="absolute inset-0 mx-auto flex w-full max-w-[1440px] flex-col justify-between p-6 md:p-12 lg:px-20">
          <Link
            href="/journal"
            className="flex w-fit items-center gap-2 text-body-sm type-bold uppercase tracking-token-wider hover:text-stone-300"
          >
            <ArrowLeft size={16} />
            Back to Journal
          </Link>

          <div className="max-w-4xl space-y-4">
            <div className="flex items-center gap-4 text-body-xs type-bold uppercase tracking-token-wider opacity-80">
              <span>{new Date(post.published_at).toLocaleDateString()}</span>
              <span>&bull;</span>
              <span>Kvastram Editorial</span>
            </div>
            <h1 className="font-heading text-display-xl type-semibold uppercase tracking-token-wide md:text-display-xl">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16 lg:py-24">
        {post.excerpt && (
          <p className="mb-12 border-l-4 border-stone-900 pl-6 font-heading text-display-md type-medium leading-token-relaxed text-stone-600">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-stone prose-lg max-w-none whitespace-pre-wrap type-light text-stone-800">
          {post.content}
        </div>
      </div>
    </article>
  );
}
