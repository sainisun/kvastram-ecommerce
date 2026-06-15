'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCollection } from '@/types/homepage';

interface CollectionsSectionProps {
  collections: HomepageCollection[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {
  const displayed = collections
    .filter((collection) => Boolean(collection.image))
    .slice(0, 12);

  if (displayed.length === 0) return null;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 15,
      },
    },
  } as const;

  return (
    <section className="kv-section collections-as-seen-section bg-[var(--ds-surface-page)]">
      <div className="kv-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="collections-as-seen-head"
        >
          <div className="kv-tag">Collection edits</div>
          <h2 className="text-[var(--ds-text-primary)]">Handmade stories with a clear point of view</h2>
          <p className="text-[var(--ds-text-secondary)]">
            Explore focused edits shaped around textile mood, occasion, and everyday utility.
          </p>
        </motion.div>

        <motion.div
          className="kv-carousel collections-carousel collections-as-seen-carousel flex overflow-x-auto gap-6 py-4 scrollbar-none"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {displayed.map((collection) => (
            <motion.div
              key={collection.id}
              variants={itemVariants}
              className="kv-carousel-item flex-shrink-0 w-[280px] md:w-[360px]"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                href={`/collections/${collection.handle}`}
                className="collection-card collections-as-seen-card relative block aspect-[4/5] w-full overflow-hidden rounded-lg group"
              >
                {collection.image ? (
                  <div className="absolute inset-0">
                    <OptimizedImage
                      src={collection.image}
                      alt={collection.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.6)] via-[rgba(var(--ds-black-rgb),0.25)] to-transparent transition-opacity duration-300" />
                  </div>
                ) : (
                  <div className="collection-card-fallback absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-br from-[var(--ds-accent-primary)] to-[var(--ds-footer-bg)] text-[var(--ds-text-inverse)]">
                    <span>{collection.title}</span>
                    <small className="opacity-80">Handmade edit</small>
                  </div>
                )}
                <div className="collection-info collections-as-seen-info absolute bottom-0 inset-x-0 p-6 text-[var(--ds-text-inverse)] z-10">
                  <span className="text-[10px] uppercase tracking-widest text-[rgba(var(--ds-white-rgb),0.8)] font-medium">Collection</span>
                  <h3 className="text-xl md:text-2xl font-display mt-1 text-[var(--ds-text-inverse)]">{collection.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
