const blocks = [
  'categories',
  'hero',
  'featured',
  'products',
  'collections',
  'watch',
  'story',
  'social',
  'newsletter',
] as const;

export default function HomepageLoading() {
  return (
    <div className="homepage-shell homepage-loading" aria-label="Loading homepage">
      {blocks.map((block) => (
        <section
          key={block}
          className={`homepage-loading-block homepage-loading-${block}`}
          aria-hidden="true"
        >
          <div className="homepage-loading-shimmer" />
        </section>
      ))}
    </div>
  );
}
