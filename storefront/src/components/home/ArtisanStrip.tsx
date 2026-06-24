import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const ARTISANS = [
  {
    name: 'Sunita Devi',
    craft: 'Kantha embroidery',
    region: 'Jaipur, Rajasthan',
    years: '22 years',
    initials: 'SD',
    color: 'bg-[var(--ds-surface-soft)]',
  },
  {
    name: 'Rekha Kumari',
    craft: 'Hand block printing',
    region: 'Sanganer, Rajasthan',
    years: '15 years',
    initials: 'RK',
    color: 'bg-[var(--ds-surface-soft)]',
  },
  {
    name: 'Champa Bai',
    craft: 'Kantha quilting',
    region: 'Murshidabad, West Bengal',
    years: '30 years',
    initials: 'CB',
    color: 'bg-[var(--ds-surface-soft)]',
  },
  {
    name: 'Geeta Sharma',
    craft: 'Natural dyeing',
    region: 'Jaipur, Rajasthan',
    years: '18 years',
    initials: 'GS',
    color: 'bg-[var(--ds-surface-soft)]',
  },
];

export function ArtisanStrip() {
  return (
    <section className="kv-section bg-[var(--ds-surface-page)]">
      <div className="kv-container">
        <div className="kv-section-head mb-8 md:mb-12">
          <div>
            <div className="kv-tag">The hands behind every piece</div>
            <h2 className="kv-title">Meet our <em className="italic">artisans</em></h2>
          </div>
          <Link href="/about#artisans" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--ds-radius-sm)] px-6 font-ui text-body-xs font-[var(--ds-type-ui-weight)] tracking-[var(--ds-type-button-tracking)] leading-[var(--ds-leading-tight)] [text-transform:var(--ds-type-button-transform)] transition-colors duration-150 no-underline border border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)] hover:border-[var(--ds-accent-primary)] hover:text-[var(--ds-accent-primary)] focus-visible:outline-2 focus-visible:outline-[var(--ds-accent-primary)] focus-visible:outline-offset-2">
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
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${artisan.color} text-body-sm type-semibold text-[var(--ds-text-primary)]`}
              >
                {artisan.initials}
              </div>

              <p className="text-body-sm type-semibold text-[var(--ds-text-primary)]">
                {artisan.name}
              </p>
              <p className="mt-1 text-body-xs text-[var(--ds-text-muted)]">
                {artisan.craft}
              </p>
              <p className="mt-1 text-body-xs tracking-[var(--ds-type-label-tracking)] text-[var(--ds-text-muted)]">
                {artisan.region}
              </p>

              <div className="mt-4 border-t border-[var(--ds-border-subtle)] pt-4">
                <span className="text-body-xs type-medium tracking-[var(--ds-type-label-tracking)] text-[var(--ds-accent-primary)]">
                  {artisan.years} of craft
                </span>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-body-sm leading-[var(--ds-leading-relaxed)] text-[var(--ds-text-muted)]">
          Every Kvastram piece is signed by the artisan who made it - their name is on the care label inside.{' '}
          <Link href="/about" className="text-[var(--ds-text-primary)] underline underline-offset-4 hover:text-[var(--ds-accent-primary)]">
            Learn about our makers {'->'}
          </Link>
        </p>
      </div>
    </section>
  );
}

