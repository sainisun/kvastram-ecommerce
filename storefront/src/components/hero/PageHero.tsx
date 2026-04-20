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
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
        {subtitle && (
          <span className="font-body block text-[13px] font-medium uppercase tracking-[0.08em] text-white/80">
            {subtitle}
          </span>
        )}
        <h1 className="font-heading text-[clamp(40px,5vw,72px)] font-normal tracking-[-0.03em] text-white leading-[1.02]">
          {title}
        </h1>
        {description && (
          <p className="font-body mx-auto max-w-xl text-[15px] font-[300] leading-[1.7] text-white/80 md:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
