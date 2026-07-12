import { ButtonLink } from '@/design-system';

function whatsappHref(message: string) {
  return `https://wa.me/message/odhvica?text=${encodeURIComponent(message)}&utm_source=homepage&utm_medium=cta`;
}

export function ShoppingHelpStrip() {
  return (
    <section className="max-md:py-[var(--ds-space-md)] bg-parchment border-y border-border-subtle" aria-label="Shopping and Fit Help">
      <div className="ds-home-container grid gap-[var(--ds-space-md)] items-center md:grid-cols-[1fr_auto]">
        <div>
          <div className="kv-tag">Fit &amp; scale help</div>
          <h2 className="kv-title">Need size, fabric, or more photos?</h2>
          <p className="kv-sub mt-[var(--ds-space-xs)]">
            Ask before you buy. See pieces in motion, check measurements, or ask for extra photos. Especially useful for jackets, kimonos, bags, and gifts.
          </p>
        </div>
        <div className="flex flex-wrap gap-[var(--ds-space-xs)]">
          <ButtonLink href="/reels" variant="primary" size="md">
            Watch fit reels
          </ButtonLink>
          <ButtonLink
            href={whatsappHref('Hi, I need sizing help for a Odhvica product')}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="md"
          >
            WhatsApp help
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
