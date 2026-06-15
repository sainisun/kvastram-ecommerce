'use client';

import { motion } from 'framer-motion';
import { Instagram, Heart, MessageCircle } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface InstagramPost {
  id: string;
  imageUrl: string;
  likes: number;
  comments: number;
  caption: string;
  link: string;
}

const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'post-1',
    imageUrl: '/images/home/category-jackets.jpg',
    likes: 342,
    comments: 18,
    caption: 'Soft cotton, light quilting, and timeless comfort. Our reversible bohemian jackets are made for every season. 🍂✨ #SlowFashion',
    link: 'https://instagram.com',
  },
  {
    id: 'post-2',
    imageUrl: '/images/home/collection-bridal.jpg',
    likes: 512,
    comments: 29,
    caption: 'Intricate details handcrafted with love. Preserving heritage crafts, one stitch at a time. ❤️ #JaipurPrints #Handmade',
    link: 'https://instagram.com',
  },
  {
    id: 'post-3',
    imageUrl: '/images/home/category-bags.jpg',
    likes: 289,
    comments: 12,
    caption: 'Accessorize with meaning. Hand-block printed tote bags that hold both your essentials and a piece of craft heritage. 👜🌿 #Kvastram',
    link: 'https://instagram.com',
  },
  {
    id: 'post-4',
    imageUrl: '/images/home/category-dresses.jpg',
    likes: 423,
    comments: 22,
    caption: 'Made for golden hours. Lightweight, breathable, and gracefully designed block-printed dresses. ☀️👗 #IndianFashion',
    link: 'https://instagram.com',
  },
  {
    id: 'post-5',
    imageUrl: '/images/home/category-quilts.jpg',
    likes: 671,
    comments: 41,
    caption: 'Cozy up in Jaipuri comfort. Our hand-loomed quilts bring warmth, history, and vibrant colors to your living space. 🛏️🌸 #HomeDecor',
    link: 'https://instagram.com',
  },
  {
    id: 'post-6',
    imageUrl: '/images/home/collection-summer.jpg',
    likes: 356,
    comments: 15,
    caption: 'Bask in the summer prints. Breathable cotton collections crafted by Jaipur artisans. 🌾✨ #ArtisanalEdit #CottonLove',
    link: 'https://instagram.com',
  },
];

export function InstagramSection() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
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
    <section className="kv-section bg-[var(--ds-surface-paper)] overflow-hidden" aria-label="Follow us on Instagram">
      <div className="kv-container">
        <div className="text-center mb-10">
          <div className="kv-tag text-xs tracking-widest uppercase mb-2 block font-medium">Shop Our Look</div>
          <h2 className="kv-title text-3xl font-display md:text-4xl text-[var(--ds-text-primary)]">Follow Our Journey</h2>
          <p className="kv-sub mt-3 max-w-xl mx-auto text-[var(--ds-text-secondary)] text-sm">
            Tag us <span className="font-semibold text-[var(--ds-accent-primary)]">@Kvastram</span> on Instagram to get featured. Explore our community and craft stories.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {INSTAGRAM_POSTS.map((post) => (
            <motion.a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square w-full overflow-hidden rounded-md bg-[var(--ds-surface-soft)] shadow-sm hover:shadow-md transition-shadow duration-300"
              variants={itemVariants}
            >
              <OptimizedImage
                src={post.imageUrl}
                alt={post.caption}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-[rgba(var(--ds-black-rgb),0.5)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-[var(--ds-text-inverse)] z-10">
                <div className="flex justify-end">
                  <Instagram size={20} className="text-[rgba(var(--ds-white-rgb),0.9)]" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-4 items-center justify-center">
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Heart size={16} fill="currentColor" className="text-[var(--ds-text-inverse)]" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <MessageCircle size={16} fill="currentColor" className="text-[var(--ds-text-inverse)]" />
                      {post.comments}
                    </span>
                  </div>
                  <p className="text-[10px] text-[rgba(var(--ds-white-rgb),0.8)] line-clamp-2 leading-tight mt-1 text-center">
                    {post.caption}
                  </p>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
