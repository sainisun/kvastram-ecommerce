import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const ARTISANS = [
  {
    name: 'Sunita Devi',
    craft: 'Kantha embroidery',
    region: 'Jaipur, Rajasthan',
    years: '22 years',
    initials: 'SD',
    color: 'bg-amber-100',
  },
  {
    name: 'Rekha Kumari',
    craft: 'Hand block printing',
    region: 'Sanganer, Rajasthan',
    years: '15 years',
    initials: 'RK',
    color: 'bg-rose-100',
  },
  {
    name: 'Champa Bai',
    craft: 'Kantha quilting',
    region: 'Murshidabad, West Bengal',
    years: '30 years',
    initials: 'CB',
    color: 'bg-emerald-100',
  },
  {
    name: 'Geeta Sharma',
    craft: 'Natural dyeing',
    region: 'Jaipur, Rajasthan',
    years: '18 years',
    initials: 'GS',
    color: 'bg-indigo-100',
  },
];

export function ArtisanStrip() {
  return (
    <section className="bg-[#f8f1eb] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
              The hands behind every piece
            </div>
            <h2 className="mt-3 font-heading text-[clamp(30px,3.5vw,48px)] font-medium leading-[0.97] tracking-[-0.03em] text-stone-950">
              Meet our <em className="italic">artisans</em>
            </h2>
          </div>
          <Link
            href="/about#artisans"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:text-stone-900"
          >
            All artisans
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {ARTISANS.map((artisan) => (
            <div
              key={artisan.name}
              className="group relative overflow-hidden bg-white p-6 transition-shadow hover:shadow-md"
            >
              {/* Avatar placeholder — replace with real photo via Cloudinary */}
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${artisan.color} text-[15px] font-semibold text-stone-700`}
              >
                {artisan.initials}
              </div>

              <p className="font-body text-[13px] font-semibold text-stone-900">
                {artisan.name}
              </p>
              <p className="font-body mt-1 text-[12px] text-stone-500">
                {artisan.craft}
              </p>
              <p className="font-body mt-1 text-[11px] uppercase tracking-[0.1em] text-stone-400">
                {artisan.region}
              </p>

              <div className="mt-4 border-t border-stone-100 pt-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-amber-700">
                  {artisan.years} of craft
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[13px] leading-7 text-stone-500">
          Every Kvastram piece is signed by the artisan who made it — their name is on the care label inside.{' '}
          <Link href="/about" className="underline underline-offset-4 hover:text-stone-800">
            Learn about our makers →
          </Link>
        </p>
      </div>
    </section>
  );
}
