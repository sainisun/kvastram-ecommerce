'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { cloudinaryUrlOrNull } from '@/lib/media';

interface HomepageSettings {
  brand_story_title?: string | null;
  brand_story_content?: string | null;
  brand_story_image?: string | null;
}

interface BrandStoryProps {
  settings: HomepageSettings;
}

export function BrandStory({ settings }: BrandStoryProps) {
  const title =
    settings.brand_story_title || 'Preserving craft, one thread at a time';
  const content =
    settings.brand_story_content ||
    'Every Kvastram piece is selected for its craft, texture, and everyday wearability, connecting Jaipur-rooted workmanship with modern wardrobes.';
  const imageUrl =
    cloudinaryUrlOrNull(settings.brand_story_image) || '/images/home/atelier-story.jpg';

  return (
    <section className="kv-section bg-[var(--ds-surface-paper)] border-b border-[var(--ds-border-subtle)] overflow-hidden">
      <div className="kv-container story-block grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="kv-tag">Our story</div>
          <h2 className="kv-title text-[var(--ds-text-primary)] font-display text-3xl md:text-4xl leading-tight">{title}</h2>
          <p className="kv-sub mt-4 text-[var(--ds-text-secondary)] text-sm md:text-base leading-relaxed">{content}</p>
          <div className="mt-6">
            <Link href="/about" className="home-link-button home-link-button--primary inline-flex items-center">
              Our Full Story
            </Link>
          </div>
        </motion.div>
        
        <motion.div
          className="story-art"
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
        >
          <div className="story-art-media relative w-full aspect-[4/3] md:aspect-[16/10] lg:aspect-[4/3] overflow-hidden rounded-lg shadow-md bg-[var(--ds-surface-soft)]">
            <OptimizedImage
              src={imageUrl}
              alt={title}
              fill
              loading="eager"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
