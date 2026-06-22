import OptimizedImage from '@/components/ui/OptimizedImage';
import { ButtonLink } from '@/components/ui/Button';
import type { HomepageBrandStory } from '@/types/homepage';

export function BrandStory({ story }: { story: HomepageBrandStory | null }) {
  if (!story) return null;

  return (
    <section className="homepage-section" data-home-section="8-brand-story">
      <div className="homepage-container homepage-story">
        <div className="homepage-story-media">
          <OptimizedImage
            src={story.image_url}
            alt={story.title}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
        <div className="homepage-story-copy">
          <p className="homepage-eyebrow">Our Story</p>
          <h2>{story.title}</h2>
          <p>{story.content}</p>
          <ButtonLink href="/about" variant="outline" size="md">
            Discover Kvastram
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
