import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { cloudinaryUrlOrNull } from '@/lib/media';

interface HeroBannerFallback {
  image_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  button_link?: string | null;
}

interface HomepageSettings {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_cta_text?: string | null;
  hero_cta_link?: string | null;
  hero_image?: string | null;
}

interface HeroSectionProps {
  settings: HomepageSettings;
  fallbackBanner?: HeroBannerFallback | null;
}

export function HeroSection({ settings, fallbackBanner }: HeroSectionProps) {
  const bannerImage = cloudinaryUrlOrNull(fallbackBanner?.image_url);
  const settingsImage = cloudinaryUrlOrNull(settings.hero_image);
  const imageUrl =
    bannerImage || settingsImage || '/images/home/hero-main.jpg';
  const hasCustomTitle = Boolean(settings.hero_title || fallbackBanner?.title);
  const title = settings.hero_title || fallbackBanner?.title || '';
  const subtitle =
    settings.hero_subtitle || fallbackBanner?.subtitle || 'A Kavastram Summer • Now Live';
  const ctaText =
    settings.hero_cta_text || fallbackBanner?.button_text || 'Shop the Collection';
  const ctaLink = settings.hero_cta_link || fallbackBanner?.button_link || '/products';

  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
      <div className="absolute inset-0">
        <OptimizedImage
          src={imageUrl}
          alt={hasCustomTitle ? title : 'Kavastram hero'}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(0,0,0,0.3),transparent_70%),linear-gradient(to_right,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.1)_60%)]" />

      <div className="absolute inset-0">
        <div className="mx-auto flex h-full max-w-[1280px] items-end px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
          <div className="max-w-2xl text-left">
            <div className="text-[11px] uppercase tracking-[0.25em] text-white">{subtitle}</div>
            {hasCustomTitle ? (
              <h1 className="mt-5 max-w-3xl font-heading text-[clamp(52px,6vw,84px)] font-normal leading-[0.94] tracking-[-0.03em] text-white">
                {title}
              </h1>
            ) : (
              <h1 className="mt-5 max-w-3xl font-heading text-[clamp(52px,6vw,84px)] font-normal leading-[0.94] tracking-[-0.03em] text-white">
                Woven with <em className="italic">intention</em>,<br />
                worn with joy.
              </h1>
            )}
            <p className="mt-4 max-w-xl text-[17px] leading-8 text-white/92">
              Handcrafted ethnic wear designed for the modern Indian woman — where timeless
              meets tomorrow.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={ctaLink}
                className="inline-flex items-center justify-center bg-white px-8 py-4 text-[12px] font-medium uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-stone-200"
              >
                {ctaText}
              </Link>
              <Link
                href="/collections"
                className="inline-flex items-center justify-center border border-white px-8 py-4 text-[12px] font-medium uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:bg-white hover:text-black"
              >
                Explore
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
        <span className="h-1.5 w-7 bg-white" />
        <span className="h-1.5 w-7 bg-white/40" />
        <span className="h-1.5 w-7 bg-white/40" />
      </div>
    </section>
  );
}
