'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Button, IconButton } from '@/components/ui/Button';

interface Testimonial {
  id: string;
  name: string;
  location?: string;
  avatar_url?: string | null;
  rating?: number;
  content: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialsCarousel({
  testimonials,
}: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : testimonials.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < testimonials.length - 1 ? prev + 1 : 0));
  };

  const currentTestimonial = testimonials[currentIndex];
  const initials = currentTestimonial.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const rating = currentTestimonial.rating ?? 5;

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      {testimonials.length > 1 && (
        <>
          <IconButton
            type="button"
            onClick={handlePrev}
            variant="ghost"
            size="md"
            className="absolute left-0 top-1/2 z-10 h-10 w-10 -translate-x-4 -translate-y-1/2 rounded-full bg-[rgba(var(--ds-surface-paper-rgb),0.1)] text-[var(--ds-text-inverse)] hover:bg-[rgba(var(--ds-surface-paper-rgb),0.2)] md:-translate-x-16"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </IconButton>
          <IconButton
            type="button"
            onClick={handleNext}
            variant="ghost"
            size="md"
            className="absolute right-0 top-1/2 z-10 h-10 w-10 translate-x-4 -translate-y-1/2 rounded-full bg-[rgba(var(--ds-surface-paper-rgb),0.1)] text-[var(--ds-text-inverse)] hover:bg-[rgba(var(--ds-surface-paper-rgb),0.2)] md:translate-x-16"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </IconButton>
        </>
      )}

      {/* Testimonial Content */}
      <div className="animate-fade-in">
        {/* Stars */}
        <div className="mb-10 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={24}
              fill={i < rating ? 'currentColor' : 'none'}
              className={i < rating ? 'text-[var(--ds-accent-gold)]' : 'text-[var(--ds-text-secondary)]'}
            />
          ))}
        </div>

        {/* Quote */}
        <h2 className="text-display-md md:text-display-xl lg:text-display-xl font-display italic leading-token-tight mb-12 max-w-4xl mx-auto">
          &ldquo;{currentTestimonial.content}&rdquo;
        </h2>

        {/* Author */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-[rgba(var(--ds-text-secondary-rgb),0.5)] backdrop-blur-sm rounded-full mb-2 overflow-hidden relative flex items-center justify-center border border-[var(--ds-border-strong)]">
            {currentTestimonial.avatar_url ? (
              <OptimizedImage
                src={currentTestimonial.avatar_url}
                alt={currentTestimonial.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="text-[var(--ds-text-muted)] font-display text-display-sm italic">
                {initials}
              </span>
            )}
          </div>
          <p className="type-bold text-body-sm tracking-token-wider ">
            {currentTestimonial.name}
          </p>
          {currentTestimonial.location && (
            <p className="text-[var(--ds-text-muted)] text-body-sm font-display italic">
              {currentTestimonial.location}
            </p>
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {testimonials.map((_, index) => (
            <Button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              variant="ghost"
              size="sm"
              className={`h-2 min-h-0 rounded-full border-0 p-0 transition-all ${
                index === currentIndex
                  ? 'w-6 bg-[var(--ds-surface-paper)]'
                  : 'w-2 bg-[var(--ds-text-secondary)] hover:bg-[var(--ds-text-muted)]'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
