interface CommunityItem {
  gradient: string;
  user: string;
  caption: string;
  tag: string | null;
}

interface CommunitySectionProps {
  communityItems: CommunityItem[];
}

export function CommunitySection({ communityItems }: CommunitySectionProps) {
  return (
    <section style={{ padding: '80px 64px', background: 'var(--white)' }}>
      <div
        className="section-header-prem reveal"
        style={{ marginBottom: '48px' }}
      >
        <div>
          <p className="section-eyebrow-prem">#WearKvastram</p>
          <h2 className="section-title-prem">
            Styled by Our <em>Community</em>
          </h2>
        </div>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--mid)',
            maxWidth: '280px',
            textAlign: 'right',
            lineHeight: 1.7,
          }}
          className="hidden md:block"
        >
          Real people. Real style. Tag us to be featured.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2px',
          marginBottom: '40px',
        }}
        className="grid-cols-2 md:grid-cols-3"
      >
        {communityItems.map(({ gradient, user, caption, tag }, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden"
            style={{ aspectRatio: '1/1' }}
          >
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-end`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: '40px', opacity: 0.3 }}>👗</span>
              </div>
              {tag && (
                <span
                  className="absolute top-3 left-3"
                  style={{
                    background: 'rgba(248,246,243,0.9)',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    padding: '5px 10px',
                    color: 'var(--black)',
                  }}
                >
                  {tag}
                </span>
              )}
              <div className="absolute inset-0 bg-[var(--black)] bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-500" />
              <div
                className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{
                  background:
                    'linear-gradient(to top, rgba(8,8,8,0.8), transparent)',
                }}
              >
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--white)',
                    marginBottom: '4px',
                  }}
                >
                  {user}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'rgba(248,246,243,0.8)',
                    lineHeight: 1.4,
                  }}
                >
                  {caption}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <a
          href="https://instagram.com/kvastram"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary-prem"
        >
          📸 Follow Us @kvastram
        </a>
      </div>
    </section>
  );
}