import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';

export const revalidate = 60; // Re-generate at most every 60 seconds (ISR)

// Define interface for post since backend types may not have it
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  published_at?: string;
  updated_at?: string;
}

export default async function JournalPage() {
  const data = await api.getPosts();
  const posts: Post[] = data.posts || [];

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="mb-12 space-y-4 text-center md:mb-16">
        <span className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
          The Journal
        </span>
        <h1 className="text-display-xl font-serif text-stone-900 italic">
          Stories from the Atelier
        </h1>
        <p className="text-stone-600 type-light max-w-2xl mx-auto">
          Exploring the intersection of heritage craftsmanship, sustainable
          luxury, and modern design.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/journal/${post.slug}`}
            className="group block space-y-4"
          >
            <div className="aspect-[4/5] bg-stone-200 overflow-hidden relative">
              {post.cover_image ? (
                <OptimizedImage
                  src={post.cover_image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300 italic font-serif">
                  Kvastram Journal
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-body-xs text-stone-500 type-bold uppercase tracking-token-wider">
                {new Date(post.published_at || new Date()).toLocaleDateString()}
              </div>
              <h2 className="text-display-md font-serif text-stone-900 group-hover:text-stone-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-stone-600 type-light line-clamp-3">
                {post.excerpt || post.content.substring(0, 150) + '...'}
              </p>
              <span className="inline-block text-body-xs type-bold border-b border-stone-900 pb-1 mt-2">
                Read Story
              </span>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 text-stone-400 type-light italic">
          No stories published yet.
        </div>
      )}
    </div>
  );
}

