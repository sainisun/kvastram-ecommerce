import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface HomepageSettings {
  brand_story_title?: string | null;
  brand_story_content?: string | null;
  brand_story_image?: string | null;
}

interface BrandStoryProps {
  settings: HomepageSettings;
}

export function BrandStory({ settings }: BrandStoryProps) {
  const title = settings.brand_story_title || 'Crafted with intention';
  const content =
    settings.brand_story_content ||
    'Every Kavastram piece begins in the hands of our artisans — where heritage techniques meet contemporary design. From the first drape to the final stitch, each garment is made to be lived in, not just worn.';
  const imageUrl = settings.brand_story_image || '/images/home/atelier-story.jpg';

  return (
    <section className="bg-white px-4 py-0 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1280px] gap-0 lg:grid-cols-2">
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

        <div className="flex flex-col justify-center bg-[#f8f1eb] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            Our Story
          </div>
          <h3 className="mt-3 max-w-xl font-heading text-[clamp(34px,4vw,56px)] font-medium leading-[0.96] tracking-[-0.03em] text-stone-950">
            Crafted with <em className="italic">intention</em>
          </h3>
          <p className="mt-6 max-w-xl text-[16px] leading-8 text-stone-700">
            {content}
          </p>
          <p className="mt-4 max-w-xl text-[16px] leading-8 text-stone-700">
            We believe ethnic wear should feel like home, look like magic, and last like memory.
          </p>
          <div className="mt-8">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900 transition-colors hover:text-stone-600"
            >
              Read Our Story
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
