import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { cloudinaryUrlOrNull } from '@/lib/media';

interface HomepageSettings {
  brand_story_title?: string | null;
  brand_story_content?: string | null;
  brand_story_image?: string | null;
}

interface BrandStoryProps {
  settings: HomepageSettings;
}

export function BrandStory({ settings }: BrandStoryProps) {
  const title =
    settings.brand_story_title || 'Preserving craft, one thread at a time';
  const content =
    settings.brand_story_content ||
    'Every Kvastram piece is selected for its craft, texture, and everyday wearability, connecting Jaipur-rooted workmanship with modern wardrobes.';
  const imageUrl =
    cloudinaryUrlOrNull(settings.brand_story_image) || '/images/home/atelier-story.jpg';

  return (
    <section className="kv-section bg-[var(--ds-surface-paper)]">
      <div className="kv-container story-block">
        <div>
          <div className="kv-tag">Our story</div>
          <h2 className="kv-title">{title}</h2>
          <p className="kv-sub mt-4">{content}</p>
          <br />
          <Link href="/about" className="home-link-button home-link-button--primary">
            Our Full Story
          </Link>
        </div>
        <div className="story-art">
          <div className="story-art-media relative w-full overflow-hidden">
            <OptimizedImage
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
