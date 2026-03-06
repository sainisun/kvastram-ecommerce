import TestimonialsCarousel from '@/components/TestimonialsCarousel';

interface TestimonialsSectionProps {
  testimonials: Array<{
    id: string;
    name: string;
    location?: string;
    content: string;
    rating?: number;
    avatar?: string;
  }>;
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const transformedTestimonials = testimonials.map((t) => ({
    id: t.id,
    name: t.name,
    location: t.location || '',
    avatar_url: t.avatar || null,
    rating: t.rating ?? 5,
    content: t.content,
  }));

  return (
    <section
      className="testimonial-section-prem"
      style={{ background: 'var(--white)' }}
    >
      {transformedTestimonials.length > 0 ? (
        <TestimonialsCarousel testimonials={transformedTestimonials} />
      ) : (
        <>
          {/* Stars */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
              marginBottom: '40px',
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#080808"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <p className="testimonial-text-prem reveal">
            &ldquo;The craftsmanship is unlike anything I&apos;ve encountered in
            Europe. The pashmina shawl is incredibly soft yet warm — a true
            heirloom piece.&rdquo;
          </p>
          <div className="testimonial-author-prem reveal reveal-delay-1">
            <span className="author-line-prem" />
            <div>
              <p className="author-name-prem">Elena Rossi</p>
              <p className="author-loc-prem">Milan, Italy</p>
            </div>
            <span className="author-line-prem" />
          </div>
        </>
      )}
    </section>
  );
}