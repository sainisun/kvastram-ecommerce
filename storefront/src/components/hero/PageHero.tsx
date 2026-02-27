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
          <span className="text-white/80 text-xs font-bold tracking-[0.25em] uppercase block">
            {subtitle}
          </span>
        )}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-[1.1]">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl mx-auto text-white/80 font-light text-lg leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
