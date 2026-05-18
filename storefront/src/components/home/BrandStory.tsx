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
  const imageUrl = cloudinaryUrlOrNull(settings.brand_story_image);

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
          {imageUrl ? (
            <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-lg)]">
              <OptimizedImage
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : (
            <span aria-hidden="true">K</span>
          )}
        </div>
      </div>
    </section>
  );
}
