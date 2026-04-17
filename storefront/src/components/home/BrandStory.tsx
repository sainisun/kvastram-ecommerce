import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

export function BrandStory() {
  return (
    <section className="bg-[#221b16] py-16 text-white sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-[#3a2d24]">
          <div className="aspect-[4/3] w-full bg-[radial-gradient(circle_at_top,#8c6f58,transparent_55%),linear-gradient(135deg,#2c211a,#5b4638)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
              <Play className="text-white/80" size={34} />
            </div>
          </div>
          <div className="absolute left-6 top-6 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm">
            Our Story
          </div>
        </div>

        <div className="space-y-5 text-center lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-300">
            Our Story
          </p>
          <h3 className="font-heading text-[32px] font-semibold leading-[0.96] sm:text-[40px] lg:text-[52px]">
            Rooted in craft, shaped for today
          </h3>
          <p className="max-w-xl text-[15px] font-[300] leading-8 text-stone-300 lg:max-w-none">
            Kvastram celebrates Indian textile heritage through refined, modern
            silhouettes. This section stays on the homepage, but now sits more
            naturally inside a commerce-led luxury flow.
          </p>
          <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone-300">
                Since
              </p>
              <p className="mt-2 text-xl font-semibold">1987</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone-300">
                Crafted
              </p>
              <p className="mt-2 text-xl font-semibold">By Artisans</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone-300">
                Made For
              </p>
              <p className="mt-2 text-xl font-semibold">Modern Wear</p>
            </div>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-900 transition-colors hover:bg-stone-100"
          >
            Read Our Story
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
