import Link from 'next/link';
import { Card } from '@/components/ui/Card';

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
          <Link href="/about#artisans" className="home-link-button home-link-button--outline">
            All artisans
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6 lg:gap-8">
          {ARTISANS.map((artisan) => (
            <Card
              key={artisan.name}
              className="group relative overflow-hidden p-6 transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${artisan.color} text-body-sm type-semibold color-ink`}
              >
                {artisan.initials}
              </div>

              <p className="text-body-sm type-semibold color-ink">
                {artisan.name}
              </p>
              <p className="mt-1 text-body-xs color-muted">
                {artisan.craft}
              </p>
              <p className="mt-1 text-body-xs uppercase tracking-token-wider color-muted">
                {artisan.region}
              </p>

              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <span className="text-body-xs type-medium uppercase tracking-token-wider color-accent">
                  {artisan.years} of craft
                </span>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-body-sm leading-7 color-muted">
          Every Kvastram piece is signed by the artisan who made it - their name is on the care label inside.{' '}
          <Link href="/about" className="color-ink underline underline-offset-4 hover:color-accent">
            Learn about our makers {'->'}
          </Link>
        </p>
      </div>
    </section>
  );
}

