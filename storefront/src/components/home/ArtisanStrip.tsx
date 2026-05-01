import Link from 'next/link';

const ARTISANS = [
  {
    name: 'Sunita Devi',
    craft: 'Kantha embroidery',
    region: 'Jaipur, Rajasthan',
    years: '22 years',
    initials: 'SD',
    color: 'bg-[var(--soft)]',
  },
  {
    name: 'Rekha Kumari',
    craft: 'Hand block printing',
    region: 'Sanganer, Rajasthan',
    years: '15 years',
    initials: 'RK',
    color: 'bg-[var(--soft)]',
  },
  {
    name: 'Champa Bai',
    craft: 'Kantha quilting',
    region: 'Murshidabad, West Bengal',
    years: '30 years',
    initials: 'CB',
    color: 'bg-[var(--soft)]',
  },
  {
    name: 'Geeta Sharma',
    craft: 'Natural dyeing',
    region: 'Jaipur, Rajasthan',
    years: '18 years',
    initials: 'GS',
    color: 'bg-[var(--soft)]',
  },
];

export function ArtisanStrip() {
  return (
    <section className="kv-section bg-[var(--cream)]">
      <div className="kv-container">
        <div className="kv-section-head mb-8 md:mb-12">
          <div>
            <div className="kv-tag">The hands behind every piece</div>
            <h2 className="kv-title">Meet our <em className="italic">artisans</em></h2>
          </div>
          <Link href="/about#artisans" className="kv-btn kv-btn-outline">
            All artisans
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6 lg:gap-8">
          {ARTISANS.map((artisan) => (
            <div
              key={artisan.name}
              className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${artisan.color} text-[14px] font-semibold text-[var(--ink)]`}
              >
                {artisan.initials}
              </div>

              <p className="text-[13px] font-semibold text-[var(--ink)]">
                {artisan.name}
              </p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                {artisan.craft}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                {artisan.region}
              </p>

              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--sienna)]">
                  {artisan.years} of craft
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[13px] leading-7 text-[var(--muted)]">
          Every Kvastram piece is signed by the artisan who made it — their name is on the care label inside.{' '}
          <Link href="/about" className="text-[var(--ink)] underline underline-offset-4 hover:text-[var(--sienna)]">
            Learn about our makers →
          </Link>
        </p>
      </div>
    </section>
  );
}
