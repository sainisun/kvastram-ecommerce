import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
  const title = settings.brand_story_title || 'Not a factory. A family of hands.';
  const content =
    settings.brand_story_content ||
    'In a small workshop in Jaipur, a group of women sit together each morning and begin to stitch. No machines. No rush. Just thread, needle, and years of knowledge passed down from mothers and grandmothers. That\'s where every Kvastram piece begins.';
  const imageUrl =
    cloudinaryUrlOrNull(settings.brand_story_image) || '/images/home/atelier-story.jpg';

  return (
    <section className="bg-white py-12 md:py-16 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-0 px-6 md:px-12 lg:grid-cols-2 lg:px-20">
        <div className="relative overflow-hidden bg-[#f8f1eb]">
          <div className="aspect-[4/5]">
            <OptimizedImage
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center bg-[#f8f1eb] px-6 py-12 md:px-12 md:py-16 lg:px-16 lg:py-24">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            Made in Jaipur, India
          </div>
          <h3 className="mt-3 max-w-xl font-heading text-[clamp(34px,4vw,56px)] font-medium leading-[0.96] tracking-[-0.03em] text-stone-950">
            {title}
          </h3>
          <p className="mt-6 max-w-xl text-[16px] leading-8 text-stone-700">
            {content}
          </p>
          <p className="mt-4 max-w-xl text-[16px] leading-8 text-stone-700">
            We call the craft Kantha — a centuries-old Indian embroidery tradition where
            old fabric is layered and stitched into something entirely new. Each imperfection
            is intentional. Each piece is one of a kind.
          </p>
          <div className="mt-8 flex flex-wrap gap-6">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900 transition-colors hover:text-stone-600"
            >
              Meet the makers
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/journal/what-is-kantha"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-stone-900"
            >
              What is Kantha?
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
