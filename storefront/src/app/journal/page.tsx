import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

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
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16 space-y-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
          The Journal
        </span>
        <h1 className="text-5xl font-serif text-stone-900 italic">
          Stories from the Atelier
        </h1>
        <p className="text-stone-600 font-light max-w-2xl mx-auto">
          Exploring the intersection of heritage craftsmanship, sustainable
          luxury, and modern design.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
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
              <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                {new Date(post.published_at || new Date()).toLocaleDateString()}
              </div>
              <h2 className="text-2xl font-serif text-stone-900 group-hover:text-stone-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-stone-600 font-light line-clamp-3">
                {post.excerpt || post.content.substring(0, 150) + '...'}
              </p>
              <span className="inline-block text-xs font-bold border-b border-stone-900 pb-1 mt-2">
                Read Story
              </span>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 text-stone-400 font-light italic">
          No stories published yet.
        </div>
      )}
    </div>
  );
}
