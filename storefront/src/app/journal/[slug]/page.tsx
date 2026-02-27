import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { post } = await api.getPost(slug);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      image: post.cover_image ? [post.cover_image] : [],
      datePublished: post.published_at,
      dateModified: post.updated_at || post.published_at,
      description: post.seo_description || post.excerpt,
      author: {
        '@type': 'Organization',
        name: 'Kvastram',
        url: process.env.NEXT_PUBLIC_STORE_URL || 'https://kvastram.com',
      },
    };

    return {
      title: `${post.seo_title || post.title} | Kvastram Journal`,
      description: post.seo_description || post.excerpt,
      keywords: post.seo_keywords,
      other: {
        'script:ld+json': JSON.stringify(jsonLd),
      },
    };
  } catch (_e) {
    return {
      title: 'Article Not Found',
    };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let post;
  try {
    const data = await api.getPost(slug);
    post = data.post;
  } catch (_e) {
    notFound();
  }

  return (
    <>
      <article className="bg-white min-h-screen pb-24">
        {/* Header */}
        <div className="h-[60vh] relative text-white">
          {post.cover_image ? (
            <div className="absolute inset-0">
              <OptimizedImage
                src={post.cover_image}
                alt={post.title}
                fill
                priority
                className="object-cover brightness-[0.85]"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-stone-900"></div>
          )}

          <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto w-full">
            <Link
              href="/journal"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-stone-300 w-fit"
            >
              <ArrowLeft size={16} /> Back to Journal
            </Link>
            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] opacity-80">
                <span>{new Date(post.published_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Kvastram Editorial</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif italic leading-tight">
                {post.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl md:text-2xl font-serif italic text-stone-600 mb-12 leading-relaxed border-l-4 border-stone-900 pl-6">
              {post.excerpt}
            </p>
          )}

          {/* Body */}
          <div className="prose prose-stone prose-lg max-w-none font-light text-stone-800 whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </article>
    </>
  );
}
