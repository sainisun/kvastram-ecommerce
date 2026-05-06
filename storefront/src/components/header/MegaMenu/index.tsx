'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { MegaColumn } from './MegaColumn';
import { MegaFeatureCard } from './MegaFeatureCard';

interface Collection {
  id: string;
  title?: string;
  name?: string;
  handle: string;
  status?: string;
  show_in_megamenu?: boolean;
  display_order?: number;
}

interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  handle?: string;
  is_active?: boolean;
  show_in_header?: boolean;
  display_order?: number;
  children?: HeaderCategory[];
}

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: HeaderCategory[];
  collections: Collection[];
}

const megaVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.0, 0.0, 0.2, 1.0] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

const FALLBACK_CATEGORY_GROUPS = [
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

const FALLBACK_SECONDARY_GROUPS = [
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

const FALLBACK_COLLECTION_GROUPS = [
  {
    label: 'Collections',
    items: [
      { label: 'Kantha Essentials', href: '/collections/kantha-essentials' },
      { label: 'Festival Ready', href: '/collections/festival-ready' },
      { label: 'Gifts Under Rs. 2,000', href: '/collections/gifts-under-2000' },
      { label: 'Block Print Edit', href: '/collections/block-print-edit' },
      { label: 'New Arrivals', href: '/products?sort=newest', isNew: true },
    ],
  },
];

function sortByDisplayOrder<T extends { display_order?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
}

function categoryHref(category: HeaderCategory) {
  return `/categories/${category.slug || category.handle}`;
}

function collectionTitle(collection: Collection) {
  return collection.title || collection.name || 'Collection';
}

export function MegaMenu({ isOpen, onClose, categories, collections }: MegaMenuProps) {
  const headerCategories = sortByDisplayOrder(
    categories.filter((category) => category.is_active !== false && category.show_in_header !== false)
  );

  const categoryGroups = headerCategories.length
    ? [
        {
          label: 'Shop',
          items: headerCategories.slice(0, 7).map((category) => ({
            label: category.name,
            href: categoryHref(category),
          })),
        },
      ]
    : FALLBACK_CATEGORY_GROUPS;

  const subcategoryItems = headerCategories
    .flatMap((category) => category.children || [])
    .filter((category) => category.is_active !== false)
    .slice(0, 8)
    .map((category) => ({
      label: category.name,
      href: categoryHref(category),
    }));

  const secondaryGroups = subcategoryItems.length
    ? [{ label: 'More to explore', items: subcategoryItems }]
    : FALLBACK_SECONDARY_GROUPS;

  const megamenuCollections = sortByDisplayOrder(
    collections.filter((collection) => collection.status === 'active' && collection.show_in_megamenu)
  ).slice(0, 5);

  const featuredCollection =
    megamenuCollections[0] ?? collections.find((collection) => collection.status === 'active');

  const collectionGroups = megamenuCollections.length
    ? [
        {
          label: 'Collections',
          items: megamenuCollections.map((collection) => ({
            label: collectionTitle(collection),
            href: `/collections/${collection.handle}`,
          })),
        },
      ]
    : FALLBACK_COLLECTION_GROUPS;

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
          <div className="grid" style={{ gridTemplateColumns: '1.1fr 1fr 1fr 180px' }}>
            <div className="px-8 py-6 border-r border-[#ede8e0]">
              <MegaColumn
                groups={categoryGroups}
                viewAllLabel="Shop all products"
                viewAllHref="/products"
                onClose={onClose}
              />
            </div>

            <div className="px-8 py-6 border-r border-[#ede8e0]">
              <MegaColumn groups={secondaryGroups} onClose={onClose} />
            </div>

            <div className="px-8 py-6 border-r border-[#ede8e0]">
              <MegaColumn
                groups={collectionGroups}
                viewAllLabel="All collections"
                viewAllHref="/collections"
                onClose={onClose}
              />
            </div>

            {featuredCollection ? (
              <MegaFeatureCard
                name={collectionTitle(featuredCollection)}
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
