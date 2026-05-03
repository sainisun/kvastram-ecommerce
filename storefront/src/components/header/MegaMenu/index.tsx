'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { MegaColumn } from './MegaColumn';
import { MegaFeatureCard } from './MegaFeatureCard';

interface Collection {
  id: string;
  name: string;
  handle: string;
  status?: string;
  show_in_megamenu?: boolean;
  display_order?: number;
}

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
}

const megaVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.0, 0.0, 0.2, 1.0] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

const COL1_GROUPS = [
  {
    label: 'Clothing',
    items: [
      { label: 'Jackets', href: '/categories/jackets' },
      { label: 'Sarees', href: '/categories/sarees' },
      { label: 'Suits & Kurtas', href: '/categories/suits-kurtas' },
      { label: 'Lehengas', href: '/categories/lehengas' },
      { label: 'T-Shirts & Tops', href: '/categories/t-shirts' },
    ],
  },
];

const COL2_GROUPS = [
  {
    label: 'Bags & Home',
    items: [
      { label: 'Tote Bags', href: '/categories/tote-bags' },
      { label: 'Toiletry Pouches', href: '/categories/toiletry-pouches' },
      { label: 'Clutches', href: '/categories/clutches' },
    ],
  },
  {
    label: 'Home & Acc',
    items: [
      { label: 'Home Textiles', href: '/categories/home-textiles' },
      { label: 'Scarves & Wraps', href: '/categories/scarves-wraps' },
      { label: 'Accessories', href: '/categories/accessories' },
    ],
  },
];

export function MegaMenu({ isOpen, onClose, collections }: MegaMenuProps) {
  const megamenuCollections = collections
    .filter((c) => c.status === 'active' && c.show_in_megamenu)
    .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
    .slice(0, 5);

  const featuredCollection = megamenuCollections[0] ?? collections.find((c) => c.status === 'active');

  const col3Groups = megamenuCollections.length
    ? [
        {
          label: 'Collections',
          items: megamenuCollections.map((c) => ({
            label: c.name,
            href: `/collections/${c.handle}`,
          })),
        },
      ]
    : [
        {
          label: 'Collections',
          items: [
            { label: 'Kantha Essentials', href: '/collections/kantha-essentials' },
            { label: 'Festival Ready', href: '/collections/festival-ready' },
            { label: 'Gifts Under ₹2,000', href: '/collections/gifts-under-2000' },
            { label: 'Block Print Edit', href: '/collections/block-print-edit' },
            { label: 'New Arrivals', href: '/new-arrivals', isNew: true },
          ],
        },
      ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={megaVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="navigation"
          aria-label="Main navigation"
          className="absolute top-full left-0 right-0 bg-white border-b-[1.5px] border-[#1a1714] z-[100] shadow-sm"
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: '1.1fr 1fr 1fr 180px' }}
          >
            {/* Col 1 */}
            <div className="px-8 py-6 border-r border-[#ede8e0]">
              <MegaColumn
                groups={COL1_GROUPS}
                viewAllLabel="View all clothing →"
                viewAllHref="/categories/clothing"
                onClose={onClose}
              />
            </div>

            {/* Col 2 */}
            <div className="px-8 py-6 border-r border-[#ede8e0]">
              <MegaColumn
                groups={COL2_GROUPS}
                onClose={onClose}
              />
            </div>

            {/* Col 3 */}
            <div className="px-8 py-6 border-r border-[#ede8e0]">
              <MegaColumn
                groups={col3Groups}
                viewAllLabel="All collections →"
                viewAllHref="/collections"
                onClose={onClose}
              />
            </div>

            {/* Col 4 — Featured card */}
            {featuredCollection ? (
              <MegaFeatureCard
                name={featuredCollection.name}
                handle={featuredCollection.handle}
                onClick={onClose}
              />
            ) : (
              <div className="h-full min-h-[240px] bg-[#1a1714]" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
