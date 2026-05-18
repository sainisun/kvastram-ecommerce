import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { EmptyState } from '@/components/ui/EmptyState';
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
    <div className="kv-page-container mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="mb-12 space-y-4 text-center md:mb-16">
        <span className="text-body-xs type-bold  tracking-token-wider text-[var(--ds-text-muted)]">
          The Journal
        </span>
        <h1 className="text-display-xl font-display text-[var(--ds-text-primary)] italic">
          Stories from the Atelier
        </h1>
        <p className="text-[var(--ds-text-secondary)] type-light max-w-2xl mx-auto">
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
            <div className="aspect-[4/5] bg-[var(--ds-surface-warm)] overflow-hidden relative">
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
                <div className="w-full h-full bg-[var(--ds-surface-soft)] flex items-center justify-center text-[var(--ds-text-disabled)] italic font-display">
                  Kvastram Journal
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-body-xs text-[var(--ds-text-muted)] type-bold  tracking-token-wider">
                {new Date(post.published_at || new Date()).toLocaleDateString()}
              </div>
              <h2 className="text-display-md font-display text-[var(--ds-text-primary)] group-hover:text-[var(--ds-text-secondary)] transition-colors">
                {post.title}
              </h2>
              <p className="text-[var(--ds-text-secondary)] type-light line-clamp-3">
                {post.excerpt || post.content.substring(0, 150) + '...'}
              </p>
              <span className="inline-block text-body-xs type-bold border-b border-[var(--ds-text-primary)] pb-1 mt-2">
                Read Story
              </span>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <EmptyState
          title="No stories published yet."
          description="New craft, styling, and atelier stories will appear here when they are published."
          className="mt-12"
        />
      )}
    </div>
  );
}
