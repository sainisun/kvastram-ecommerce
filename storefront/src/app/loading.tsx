const blockHeights: Record<string, string> = {
  categories: 'min-h-[140px]',
  hero: 'min-h-[clamp(520px,76svh,820px)]',
  featured: 'min-h-[52vw]',
  products: 'min-h-[620px]',
  collections: 'min-h-[620px]',
  watch: 'min-h-[180px]',
  story: 'min-h-[620px]',
  social: 'min-h-[620px]',
  newsletter: 'min-h-[300px]',
};

export default function HomepageLoading() {
  return (
    <div
      className="bg-[var(--ds-surface-page)] text-[var(--ds-text-primary)]"
      style={{ '--homepage-gutter': 'var(--ds-home-gutter-mobile)' } as React.CSSProperties}
      aria-label="Loading homepage"
    >
      {Object.entries(blockHeights).map(([block, heightClass]) => (
        <section
          key={block}
          className={`relative overflow-hidden bg-[var(--ds-surface-soft)] ${heightClass}`}
          aria-hidden="true"
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-[rgba(var(--ds-white-rgb),0.6)] to-transparent" />
        </section>
      ))}
    </div>
  );
}
