'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCircle } from '@/types/homepage';

interface CircularCategoriesClientProps {
  circles: HomepageCategoryCircle[];
}

export function CircularCategoriesClient({ circles }: CircularCategoriesClientProps) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  } as const;

  return (
    <section className="story-categories bg-[var(--ds-surface-paper)] border-b border-[var(--ds-border-subtle)]" aria-label="Quick category shortcuts">
      <div className="kv-container">
        <motion.div
          className="circle-row flex items-center justify-start md:justify-center overflow-x-auto py-4 gap-4 md:gap-8 scrollbar-none"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {circles.map((circle) => (
            <motion.div
              key={circle.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="flex-shrink-0"
            >
              <Link
                href={circle.link_url}
                className="circle-cat group flex flex-col items-center text-center no-underline"
              >
                <div className="circle-cat-art relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-transparent group-hover:border-[var(--ds-accent-primary)] shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden bg-[var(--ds-surface-soft)] p-0.5">
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    <OptimizedImage
                      src={circle.image_url || ''}
                      alt={circle.label}
                      fill
                      sizes="(max-width: 768px) 64px, 80px"
                      className="rounded-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
                <span className="circle-cat-name mt-2 text-xs md:text-sm font-medium text-[var(--ds-text-primary)] group-hover:text-[var(--ds-accent-primary)] transition-colors duration-300">
                  {circle.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
