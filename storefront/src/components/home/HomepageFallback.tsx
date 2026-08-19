import { ArrowRight, Sparkles } from 'lucide-react';
import { ButtonLink, HomepageContainer } from '@/design-system';

export function HomepageFallback() {
  return (
    <section
      aria-labelledby="homepage-fallback-title"
      className="relative isolate overflow-hidden bg-surface-warm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_76%_22%,rgba(var(--ds-accent-rgb),0.16),transparent_34%),linear-gradient(135deg,rgba(var(--ds-accent-gold-rgb),0.08),transparent_54%)]"
      />
      <HomepageContainer className="relative flex min-h-[clamp(30rem,62vh,42rem)] items-center py-[var(--ds-space-2xl)]">
        <div className="max-w-[var(--ds-heading-width)]">
          <div className="mb-[var(--ds-space-md)] inline-flex items-center gap-2 font-label text-body-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <Sparkles aria-hidden="true" size={14} />
            The edit is returning
          </div>
          <h1
            id="homepage-fallback-title"
            className="font-display text-display-xl font-normal leading-token-tight tracking-[-0.035em] text-primary"
          >
            Craft, colour, and quiet character.
          </h1>
          <p className="mt-[var(--ds-space-md)] max-w-[45ch] font-body text-body-lg leading-token-relaxed text-secondary">
            Our collection feed is taking a moment to reconnect. Explore the full edit and discover pieces made to be lived in.
          </p>
          <ButtonLink
            href="/products"
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight aria-hidden="true" size={17} />}
            className="mt-[var(--ds-space-lg)]"
          >
            Explore the collection
          </ButtonLink>
        </div>
      </HomepageContainer>
    </section>
  );
}
