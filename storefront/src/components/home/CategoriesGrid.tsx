'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCard } from '@/types/homepage';

interface CategoriesGridProps {
  categories: HomepageCategoryCard[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  if (categories.length === 0) return null;

  const featuredCategories = categories.slice(0, 8);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15,
      },
    },
  } as const;

  return (
    <section className="kv-section shop-category-section bg-[var(--ds-surface-paper)]">
      <div className="kv-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="kv-section-head"
        >
          <div>
            <div className="kv-tag">Shop the atelier</div>
            <h2 className="kv-title text-[var(--ds-text-primary)]">Choose your starting point</h2>
            <p className="kv-sub mt-3 text-[var(--ds-text-secondary)]">
              Sarees, jackets, bags, quilts, and everyday pieces edited by craft and use.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="shop-category-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {featuredCategories.map((cat) => (
            <motion.div key={cat.id} variants={itemVariants}>
              <Link
                href={cat.link_url}
                className="shop-category-card group no-underline block"
              >
                <div className="shop-category-media relative overflow-hidden rounded-md aspect-[4/5] bg-[var(--ds-surface-soft)]">
                  <OptimizedImage
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-[rgba(var(--ds-black-rgb),0.05)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                <span className="mt-3 block text-sm font-medium text-[var(--ds-text-primary)] group-hover:text-[var(--ds-accent-primary)] transition-colors duration-300">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
