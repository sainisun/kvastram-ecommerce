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
            <h2>From our circle</h2>
          </div>
        </div>
        <div className="homepage-social-grid">
          {posts.slice(0, 8).map((post) => (
            <a
              key={post.id}
              href={post.destination_url}
              target={post.destination_url.startsWith('https://') ? '_blank' : undefined}
              rel={post.destination_url.startsWith('https://') ? 'noopener noreferrer' : undefined}
              className="homepage-social-card"
            >
              <OptimizedImage
                src={post.image_url}
                alt={post.alt_text}
                fill
                sizes="(max-width: 767px) 50vw, 25vw"
                className="object-cover"
              />
              <span className="homepage-social-overlay">
                <Instagram aria-hidden="true" />
                {post.caption ? <span>{post.caption}</span> : null}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
