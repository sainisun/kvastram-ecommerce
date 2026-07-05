import { Instagram } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageSocialPost } from '@/types/homepage';

export function InstagramSection({ posts }: { posts: HomepageSocialPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="py-[var(--ds-home-section-space-mobile)] min-[1100px]:py-[var(--ds-home-section-space-desktop)]" data-home-section="9-social">
      <div className="w-[min(calc(100%-(var(--homepage-gutter)*2)),var(--ds-home-content-width))] mx-auto">
        <div className="py-[var(--ds-home-section-space-mobile)] min-[1100px]:py-[var(--ds-home-section-space-desktop)]-head py-[var(--ds-home-section-space-mobile)] min-[1100px]:py-[var(--ds-home-section-space-desktop)]-head-centered">
          <div>
            <p className="m-0 mb-[var(--ds-space-xs)] text-accent font-label text-body-xs font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)]">Follow Our Journey</p>
            <h2 className="font-display text-display-md text-primary">From our circle</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--ds-space-2xs)]">
          {posts.slice(0, 8).map((post) => (
            <a
              key={post.id}
              href={post.destination_url}
              target={post.destination_url.startsWith('https://') ? '_blank' : undefined}
              rel={post.destination_url.startsWith('https://') ? 'noopener noreferrer' : undefined}
              className="relative aspect-square overflow-hidden bg-surface-soft group block"
            >
              <OptimizedImage
                src={post.image_url}
                alt={post.alt_text}
                fill
                sizes="(max-width: 767px) 50vw, 25vw"
                className="object-cover"
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--ds-space-sm)] p-[var(--ds-space-md)] bg-[rgba(var(--ds-ink-rgb),0.6)] text-inverse opacity-0 text-center transition-opacity duration-[180ms] ease-[ease] group-hover:opacity-100 group-focus-visible:opacity-100">
                <Instagram aria-hidden="true" />
                {post.caption ? <span className="line-clamp-3 overflow-hidden text-body-xs">{post.caption}</span> : null}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
