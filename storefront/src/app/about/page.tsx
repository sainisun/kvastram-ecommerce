import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Story | Kvastram — Handmade in Jaipur, India',
  description:
    'Kvastram is a small workshop in Jaipur run by skilled artisan women who practice Kantha — a 300-year-old Indian embroidery art. Every piece is handmade, fairly paid, and shipped worldwide.',
};

const ARTISANS = [
  {
    name: 'Sunita Devi',
    craft: 'Kantha embroidery',
    region: 'Jaipur, Rajasthan',
    years: '22 years of craft',
    story:
      'Sunita learned Kantha from her mother at age nine. She now teaches the stitch to younger women in the neighbourhood, keeping the tradition alive for another generation.',
    initials: 'SD',
    color: 'bg-amber-100',
  },
  {
    name: 'Rekha Kumari',
    craft: 'Hand block printing',
    region: 'Sanganer, Rajasthan',
    years: '15 years of craft',
    story:
      'Rekha\'s family has been block-printing fabric in Sanganer for three generations. She carves each wooden block herself — a process that takes longer than the printing.',
    initials: 'RK',
    color: 'bg-rose-100',
  },
  {
    name: 'Champa Bai',
    craft: 'Kantha quilting',
    region: 'Murshidabad, West Bengal',
    years: '30 years of craft',
    story:
      'Champa grew up in West Bengal where Kantha quilting was a daily practice — women would recycle worn-out saris into layered quilts during the long evenings. She brought that tradition to Jaipur when she moved here 12 years ago.',
    initials: 'CB',
    color: 'bg-emerald-100',
  },
  {
    name: 'Geeta Sharma',
    craft: 'Natural dyeing',
    region: 'Jaipur, Rajasthan',
    years: '18 years of craft',
    story:
      'Geeta works only with natural dyes — indigo, turmeric, pomegranate rind. She says synthetic dyes smell wrong. She can read the colour of a sunset and name the plant that would make it.',
    initials: 'GS',
    color: 'bg-indigo-100',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-[#f8f1eb] px-6 py-24 text-center sm:py-32">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-500">
          Made in Jaipur, India
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl font-heading text-[clamp(40px,5vw,72px)] font-medium leading-[0.95] tracking-[-0.03em] text-stone-950">
          Not a factory.{' '}
          <em className="italic">A family of hands.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-8 text-stone-600">
          Kvastram is a small workshop run by artisan women in Jaipur who practice
          Kantha — a 300-year-old Indian embroidery tradition. Every piece is
          handmade, fairly paid, and carries the signature of the woman who made it.
        </p>
      </div>

      {/* The Story */}
      <div className="mx-auto max-w-[1280px] px-6 py-20 sm:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-stone-400">
              How it started
            </div>
            <h2 className="mt-4 font-heading text-[clamp(28px,3vw,42px)] font-medium leading-[1.05] tracking-[-0.02em] text-stone-950">
              A craft that almost disappeared
            </h2>
            <div className="mt-6 space-y-5 text-[16px] leading-8 text-stone-600">
              <p>
                Kantha is not decorative embroidery. It is survival art. For centuries,
                women in Rajasthan and West Bengal would take the worn saris of their
                families — the ones too thin to wear, too precious to throw — layer them
                together, and stitch them into something new. A quilt. A wrap. A bag.
                Nothing wasted. Everything transformed.
              </p>
              <p>
                By the 1990s, mass production had pushed most Kantha artisans out of
                work. The craft began to disappear from households. The women who knew
                it were getting older.
              </p>
              <p>
                Kvastram started because we believed that shouldn't happen. We found
                these women — in workshops and homes and small village cooperatives — and
                asked them a simple question: if the world was willing to pay fairly,
                would you teach others and keep making?
              </p>
              <p>
                The answer was yes. Every time.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="aspect-[4/5] bg-stone-200 relative overflow-hidden">
              {/* Replace with real workshop photo via Cloudinary */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm italic text-stone-400">Workshop photo — Jaipur</span>
              </div>
            </div>
            <p className="text-[13px] italic leading-6 text-stone-400">
              Our workshop in the old city of Jaipur, where every piece begins.
            </p>
          </div>
        </div>
      </div>

      {/* How we work */}
      <div className="bg-stone-950 px-6 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-400">
            How Kvastram works
          </div>
          <h2 className="mt-4 font-heading text-[clamp(28px,3vw,44px)] font-medium leading-[1.0] tracking-[-0.02em] text-white">
            From hands in Jaipur to your door
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Made by artisan women',
                body: 'Each piece is made entirely by hand — no factories, no machines. The artisan who makes your piece signs the care label inside with her name.',
              },
              {
                step: '02',
                title: 'Fairly paid, always',
                body: 'We pay above the regional market rate, provide consistent work through the year, and split a portion of every sale back into artisan welfare programmes.',
              },
              {
                step: '03',
                title: 'Shipped to your door',
                body: 'We pack each order carefully in Jaipur and ship via tracked courier to 50+ countries. US orders typically arrive in 10–14 days.',
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="font-heading text-[36px] font-medium text-stone-700">
                  {item.step}
                </div>
                <h3 className="mt-3 text-[16px] font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-stone-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Artisans */}
      <div id="artisans" className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-400">
            The people behind every piece
          </div>
          <h2 className="mt-4 font-heading text-[clamp(28px,3vw,44px)] font-medium leading-[1.0] tracking-[-0.02em] text-stone-950">
            Meet our artisans
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-8 text-stone-500">
            These are not stock photos. These are real women, real names, real craft.
            When you buy a Kvastram piece, one of them made it.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ARTISANS.map((artisan) => (
              <div key={artisan.name} className="border border-stone-100 p-6">
                <div
                  className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full ${artisan.color} text-[16px] font-semibold text-stone-700`}
                >
                  {artisan.initials}
                  {/* Replace with <Image> once you have real photos */}
                </div>
                <p className="text-[15px] font-semibold text-stone-900">{artisan.name}</p>
                <p className="mt-1 text-[13px] font-medium text-amber-700">{artisan.craft}</p>
                <p className="mt-0.5 text-[12px] uppercase tracking-[0.1em] text-stone-400">
                  {artisan.region}
                </p>
                <p className="mt-4 text-[14px] leading-6 text-stone-500">{artisan.story}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-300">
                  {artisan.years}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sustainability */}
      <div id="sustainability" className="bg-[#f8f1eb] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-stone-400">
                Slow fashion
              </div>
              <h2 className="mt-4 font-heading text-[clamp(28px,3vw,44px)] font-medium leading-[1.0] tracking-[-0.02em] text-stone-950">
                The opposite of fast fashion
              </h2>
              <div className="mt-6 space-y-5 text-[16px] leading-8 text-stone-600">
                <p>
                  A single Kantha jacket takes one artisan between 4 and 7 days to
                  complete. A large quilt, up to two weeks. We don't rush it.
                </p>
                <p>
                  We make in small batches — never more than we need — so nothing goes
                  to waste. Our fabric is sourced from mills in Rajasthan that use
                  natural dyes wherever possible. When we use recycled sari fabric
                  (as in our vintage Kantha line), we give new life to cloth that might
                  otherwise be discarded.
                </p>
                <p>
                  We're not perfect. But we're honest about where we are and where
                  we're going.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '100%', label: 'Handmade, no machines' },
                { num: 'Small batch', label: 'Made to order where possible' },
                { num: 'Natural dyes', label: 'No azo dyes in our workshop' },
                { num: 'Fairly paid', label: 'Above regional market rate' },
              ].map((item) => (
                <div key={item.label} className="bg-white p-6">
                  <p className="font-heading text-[22px] font-semibold text-stone-950">
                    {item.num}
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-stone-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-20 text-center sm:py-24">
        <h2 className="font-heading text-[clamp(28px,3vw,44px)] font-medium leading-[1.0] tracking-[-0.02em] text-stone-950">
          Ready to own something real?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-7 text-stone-500">
          Every Kvastram piece ships with a handwritten note from the artisan who
          made it — and their name on the care label inside.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center bg-stone-950 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-stone-800"
          >
            Shop the collection
          </Link>
          <Link
            href="/journal/what-is-kantha"
            className="inline-flex items-center border border-stone-300 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-700 transition-colors hover:border-stone-950"
          >
            What is Kantha?
          </Link>
        </div>
      </div>
    </div>
  );
}
