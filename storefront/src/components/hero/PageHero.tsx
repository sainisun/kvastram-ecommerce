import OptimizedImage from '@/components/ui/OptimizedImage';

/**
 * PageHero Component
 *
 * A reusable hero banner for internal pages (Shop, Collections, etc.).
 * Displays a large poster-style hero image with a text overlay.
 * Matches the visual language of the Home Page HeroCarousel.
 */

interface PageHeroProps {
  /** The main title displayed on the hero */
  title: string;
  /** A small label above the title (e.g. "The Collection", "Curated Series") */
  subtitle?: string;
  /** A brief description below the title */
  description?: string;
  /** Background image URL. Falls back to a gradient if not provided */
  image?: string;
}

export default function PageHero({
  title,
  subtitle,
  description,
  image,
}: PageHeroProps) {
  return (
    <section className="relative h-[40vh] min-h-[280px] md:h-[50vh] md:min-h-[360px] overflow-hidden flex items-center justify-center">
      {/* Background */}
      {image ? (
        <OptimizedImage src={image} alt={title} fill className="object-cover" priority />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--ds-text-secondary)] via-[var(--ds-text-secondary)] to-[var(--ds-text-primary)]" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-[var(--ds-text-primary)]/40" />

      {/* Content */}
      <div className="kv-page-container relative z-10 mx-auto max-w-[1440px] space-y-4 px-6 text-center md:px-12 lg:px-20">
        {subtitle && (
          <span className="font-body block text-body-sm type-medium uppercase tracking-token-wide text-[var(--ds-text-inverse)]/80">
            {subtitle}
          </span>
        )}
        <h1 className="font-display text-display-xl type-regular tracking-token-tight text-[var(--ds-text-inverse)] leading-token-tight">
          {title}
        </h1>
        {description && (
          <p className="font-body mx-auto max-w-xl text-body-md type-light leading-token-relaxed text-[var(--ds-text-inverse)]/80 md:text-body-xl">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}

