import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTestimonial } from '@/types/homepage';

interface TestimonialsProps {
  testimonials: HomepageTestimonial[];
}

function renderStars(rating?: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating || 5)));
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < filled ? 'text-[var(--sienna)]' : 'text-[var(--line)]'}>
      ★
    </span>
  ));
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  const displayed =
    testimonials.length > 0
      ? testimonials.slice(0, 3)
      : [
          {
            id: 'placeholder-ananya',
            name: 'Ananya',
            location: 'Jaipur',
            rating: 5,
            content:
              'The drape felt festive but still light enough for a full family function.',
          },
          {
            id: 'placeholder-priya',
            name: 'Priya',
            location: 'Delhi',
            rating: 5,
            content:
              'The embroidery looks handmade in the best way. It photographed beautifully.',
          },
          {
            id: 'placeholder-meera',
            name: 'Meera',
            location: 'Mumbai',
            rating: 5,
            content: 'Comfortable, special, and easy to style again.',
          },
        ];

  return (
    <section className="kv-section bg-white">
      <div className="kv-container">
        <div className="mb-8 text-center md:mb-12">
          <div className="kv-tag">Love shared by customers</div>
          <h2 className="kv-title mt-3">What they&apos;re <em>saying</em></h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {displayed.map((testimonial) => (
            <article key={testimonial.id} className="rounded-[var(--radius-lg)] bg-[var(--soft)] p-8 text-center sm:p-10">
              <div className="flex items-center justify-center gap-1 text-[14px]">
                {renderStars(testimonial.rating)}
              </div>

              <p className="font-body mt-6 min-h-[108px] text-[16px] italic leading-[1.7] text-[var(--ink)] sm:text-[17px]">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                {testimonial.avatar_url ? (
                  <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[var(--soft)]">
                    <OptimizedImage
                      src={testimonial.avatar_url}
                      alt={testimonial.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="text-left">
                  <p className="font-body text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                    {testimonial.name}
                  </p>
                  {testimonial.location ? (
                    <p className="font-body text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      {testimonial.location}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
