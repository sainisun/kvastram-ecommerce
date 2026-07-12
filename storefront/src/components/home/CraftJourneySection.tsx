import { Hand, ShieldCheck, Globe2, MessageCircle } from 'lucide-react';
import { ButtonLink, HomepageSectionHeader, OptimizedImage } from '@/design-system';
import type { HomepageBrandStory } from '@/types/homepage';

const promises = [
  {
    icon: Hand,
    title: 'Only sellable pieces make it online',
    copy: 'Every homepage piece needs real media, clear price, and enough detail to shop with confidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest photos and clear details',
    copy: 'Texture, fabric, color, and handmade variation should be visible before you open the product page.',
  },
  {
    icon: Globe2,
    title: 'Small-batch, not mass-produced',
    copy: 'Kantha, block print, and quilted cotton pieces are selected as limited textile edits.',
  },
  {
    icon: MessageCircle,
    title: 'Sizing and gift help on WhatsApp',
    copy: 'Ask for extra photos, measurements, styling help, or gifting guidance before checkout.',
  },
];

export function CraftJourneySection({ story }: { story: HomepageBrandStory | null }) {
  if (!story) return null;

  return (
    <section className="bg-surface-page border-y border-border-subtle overflow-hidden" data-home-section="8-craft-journey">
      <div className="grid md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-[1.2fr_0.8fr] divide-y md:divide-y-0 md:divide-x divide-border-subtle">
        
        {/* Left: Brand Story Image & Text */}
        <div className="p-[var(--ds-space-md)] md:p-[var(--ds-space-xl)] lg:p-[var(--ds-space-2xl)] bg-surface-soft grid items-center gap-[var(--ds-space-lg)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)]">
          <div className="relative overflow-hidden bg-surface-page aspect-[4/5] md:aspect-[5/4] rounded-sm shadow-sm">
            <OptimizedImage
              src={story.image_url}
              alt={story.title}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div>
            <HomepageSectionHeader
              eyebrow="Our Story"
              heading={story.title}
              headingClassName="text-display-md font-[var(--ds-type-heading-weight)]"
              description={story.content}
              className="mb-[var(--ds-space-lg)] gap-[var(--ds-space-xs)]"
            />
            <ButtonLink href="/about" variant="outline" size="md">
              Discover Odhvica
            </ButtonLink>
          </div>
        </div>

        {/* Right: Craft Promises */}
        <div className="p-[var(--ds-space-md)] md:p-[var(--ds-space-lg)] lg:p-[var(--ds-space-2xl)] bg-surface-paper flex flex-col justify-center">
          <div className="mb-[var(--ds-space-lg)]">
            <div className="kv-tag">Why Odhvica</div>
            <h2 className="kv-title text-display-md">Handmade, edited, and ready to wear.</h2>
            <p className="kv-sub mt-[var(--ds-space-xs)]">
              The homepage is designed around real product media, short shopping paths,
              craft proof near buying moments, and fast routes to help.
            </p>
          </div>

          <div className="grid gap-[var(--ds-space-md)] sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2" aria-label="Odhvica commerce promises">
            {promises.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="grid grid-cols-[auto_1fr] gap-[var(--ds-space-xs)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                   <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <strong className="block text-primary font-label text-body-sm font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)]">{title}</strong>
                  <p className="mt-[var(--ds-space-2xs)] text-muted font-body text-body-sm leading-[var(--ds-leading-normal)]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
