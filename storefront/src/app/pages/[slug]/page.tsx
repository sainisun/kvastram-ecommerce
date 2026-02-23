import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { page } = await api.getPage(slug);
    return {
      title: `${page.seo_title || page.title} | Kvastram`,
      description: page.seo_description,
    };
  } catch (_e) {
    return {
      title: 'Page Not Found',
    };
  }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  let page;
  try {
    const data = await api.getPage(slug);
    page = data.page;
  } catch (_e) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-12 text-center">
          {page.title}
        </h1>
        <div
          className="prose prose-stone prose-lg max-w-none font-light text-stone-800"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}
