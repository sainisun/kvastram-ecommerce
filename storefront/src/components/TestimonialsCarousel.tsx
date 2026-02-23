'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  avatar_url: string | null;
  rating: number;
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

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      {testimonials.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </button>
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
              fill={i < currentTestimonial.rating ? 'currentColor' : 'none'}
              className={
                i < currentTestimonial.rating
                  ? 'text-amber-400'
                  : 'text-stone-600'
              }
            />
          ))}
        </div>

        {/* Quote */}
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif italic leading-tight mb-12 max-w-4xl mx-auto">
          &ldquo;{currentTestimonial.content}&rdquo;
        </h2>

        {/* Author */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-stone-700/50 backdrop-blur-sm rounded-full mb-2 overflow-hidden relative flex items-center justify-center border border-stone-600">
            {currentTestimonial.avatar_url ? (
              <img
                src={currentTestimonial.avatar_url}
                alt={currentTestimonial.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-stone-300 font-serif text-xl italic">
                {initials}
              </span>
            )}
          </div>
          <p className="font-bold text-sm tracking-widest uppercase">
            {currentTestimonial.name}
          </p>
          {currentTestimonial.location && (
            <p className="text-stone-400 text-sm font-serif italic">
              {currentTestimonial.location}
            </p>
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-stone-600 hover:bg-stone-500'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
