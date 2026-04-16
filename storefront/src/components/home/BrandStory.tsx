import Link from 'next/link';
import { Play } from 'lucide-react';

export function BrandStory() {
  return (
    <section className="bg-black py-20 px-6 text-center">
      {/* Video placeholder */}
      <div className="w-full aspect-video bg-neutral-900 mb-10 flex items-center justify-center">
        <Play className="text-white/20" size={64} />
      </div>

      <span className="text-[9px] font-bold tracking-[0.4em] text-zinc-500 uppercase block mb-4">
        OUR STORY
      </span>
      <h3 className="font-heading text-3xl text-white mb-6">
        Rooted in Craft, Born for Today
      </h3>
      <p className="text-sm text-neutral-400 leading-relaxed font-light mb-10 max-w-[340px] mx-auto">
        Kvastram is a tribute to the timeless hands of Indian artisans. We preserve
        heritage through modern silhouettes designed for the contemporary global woman.
      </p>
      <Link
        href="/about"
        className="text-[10px] text-white font-bold tracking-widest uppercase border-b border-white pb-1 inline-block"
      >
        READ OUR STORY →
      </Link>
    </section>
  );
}
