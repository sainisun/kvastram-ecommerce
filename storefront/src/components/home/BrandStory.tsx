import OptimizedImage from '@/components/ui/OptimizedImage';
import { ButtonLink } from '@/components/ui/Button';
import type { HomepageBrandStory } from '@/types/homepage';

export function BrandStory({ story }: { story: HomepageBrandStory | null }) {
  if (!story) return null;

  return (
    <section className="homepage-section" data-home-section="8-brand-story">
      <div className="homepage-container grid gap-[var(--ds-space-lg)] items-center md:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)]">
        <div className="relative aspect-[4/5] md:aspect-[5/4] overflow-hidden bg-surface-soft">
          <OptimizedImage
            src={story.image_url}
            alt={story.title}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
        <div className="py-[var(--ds-space-md)]">
          <p className="homepage-eyebrow">Our Story</p>
          <h2 className="m-0 font-display text-display-md font-[var(--ds-type-heading-weight)]">{story.title}</h2>
          <p className="max-w-[58ch] mt-[var(--ds-space-md)] mb-[var(--ds-space-lg)] text-secondary">{story.content}</p>
          <ButtonLink href="/about" variant="outline" size="md">
            Discover Odhvica
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
