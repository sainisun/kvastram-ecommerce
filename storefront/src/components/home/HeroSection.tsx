import HeroCarousel from '@/components/hero/HeroCarousel';

interface Banner {
  id: string;
  section: string;
  is_active: boolean;
  image?: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface HeroSectionProps {
  isAnnouncementEnabled: boolean;
  announcementText: string;
  tickerItems: string[];
  heroBanners: Banner[];
}

export function HeroSection({
  isAnnouncementEnabled,
  announcementText,
  tickerItems,
  heroBanners,
}: HeroSectionProps) {
  return (
    <>
      {/* ═══ 1. ANNOUNCEMENT TICKER ═══ */}
      {(isAnnouncementEnabled || true) && (
        <div
          style={{
            background: 'var(--black)',
            color: 'var(--white)',
            overflow: 'hidden',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              animation: 'ticker 35s linear infinite',
              whiteSpace: 'nowrap',
              gap: 0,
            }}
          >
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span
                key={i}
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  padding: '0 48px',
                  opacity: 0.9,
                  display: 'inline-block',
                }}
              >
                {item}
                <span
                  style={{
                    display: 'inline-block',
                    width: '4px',
                    height: '4px',
                    background: 'rgba(248,246,243,0.3)',
                    borderRadius: '50%',
                    marginLeft: '48px',
                    verticalAlign: 'middle',
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 2. HERO ═══ */}
      <HeroCarousel
        banners={heroBanners.map(banner => ({
          id: banner.id,
          title: banner.title || '',
          image_url: banner.image || '',
          link: banner.link,
          section: banner.section,
        }))}
      />
    </>
  );
}