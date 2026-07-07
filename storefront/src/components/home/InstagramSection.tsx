import { Instagram } from 'lucide-react';
import { HomepageSection, HomepageSectionHeader, OptimizedImage } from '@/design-system';
import type { HomepageSocialPost } from '@/types/homepage';

export function InstagramSection({ posts }: { posts: HomepageSocialPost[] }) {
  if (posts.length === 0) return null;

  return (
    <HomepageSection data-home-section="9-social">
      <HomepageSectionHeader
        eyebrow="Follow Our Journey"
        heading="From our circle"
        align="center"
        headingClassName="text-display-md"
      />

      <div className="grid grid-cols-2 gap-[var(--ds-space-2xs)] md:grid-cols-4">
        {posts.slice(0, 8).map((post) => (
          <a
            key={post.id}
            href={post.destination_url}
            target={post.destination_url.startsWith('https://') ? '_blank' : undefined}
            rel={post.destination_url.startsWith('https://') ? 'noopener noreferrer' : undefined}
            className="group relative block overflow-hidden bg-surface-soft aspect-square"
          >
            <OptimizedImage
              src={post.image_url}
              alt={post.alt_text}
              fill
              sizes="(max-width: 767px) 50vw, 25vw"
              className="object-cover"
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--ds-space-sm)] bg-[rgba(var(--ds-ink-rgb),0.6)] p-[var(--ds-space-md)] text-center text-inverse opacity-0 transition-opacity duration-[180ms] ease-[ease] group-hover:opacity-100 group-focus-visible:opacity-100">
              <Instagram aria-hidden="true" />
              {post.caption ? (
                <span className="line-clamp-3 overflow-hidden text-body-xs">{post.caption}</span>
              ) : null}
            </span>
          </a>
        ))}
      </div>
    </HomepageSection>
  );
}
