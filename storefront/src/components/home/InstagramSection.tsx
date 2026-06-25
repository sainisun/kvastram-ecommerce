import { Instagram } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageSocialPost } from '@/types/homepage';

export function InstagramSection({ posts }: { posts: HomepageSocialPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="homepage-section" data-home-section="9-social">
      <div className="homepage-container">
        <div className="homepage-section-head homepage-section-head-centered">
          <div>
            <p className="homepage-eyebrow">Follow Our Journey</p>
            <h2 className="font-display text-display-md text-[var(--ds-text-primary)]">From our circle</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[6px]">
          {posts.slice(0, 8).map((post) => (
            <a
              key={post.id}
              href={post.destination_url}
              target={post.destination_url.startsWith('https://') ? '_blank' : undefined}
              rel={post.destination_url.startsWith('https://') ? 'noopener noreferrer' : undefined}
              className="relative aspect-square overflow-hidden bg-[var(--ds-surface-soft)] group block"
            >
              <OptimizedImage
                src={post.image_url}
                alt={post.alt_text}
                fill
                sizes="(max-width: 767px) 50vw, 25vw"
                className="object-cover"
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--ds-space-sm)] p-[var(--ds-space-md)] bg-[rgba(var(--ds-black-rgb),0.6)] text-[var(--ds-text-inverse)] opacity-0 text-center transition-opacity duration-[180ms] ease-[ease] group-hover:opacity-100 group-focus-visible:opacity-100">
                <Instagram aria-hidden="true" />
                {post.caption ? <span className="line-clamp-3 overflow-hidden text-[var(--ds-text-body-xs)]">{post.caption}</span> : null}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
