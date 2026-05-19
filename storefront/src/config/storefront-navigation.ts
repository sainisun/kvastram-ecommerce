export interface StorefrontNavItem {
  label: string;
  href: string;
  hasMega?: boolean;
}

export interface StorefrontNavLink {
  label: string;
  href: string;
  isNew?: boolean;
}

export interface StorefrontNavGroup {
  label: string;
  items: StorefrontNavLink[];
}

export const STOREFRONT_NAV_ITEMS: StorefrontNavItem[] = [
  { label: 'Shop', href: '/products', hasMega: true },
  { label: 'Collections', href: '/collections', hasMega: true },
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Reels', href: '/reels' },
  { label: 'About', href: '/about' },
];

export const CATEGORY_QUICK_LINKS: StorefrontNavLink[] = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Jackets', href: '/categories/jackets' },
  { label: 'Sarees', href: '/categories/sarees' },
  { label: 'Tote Bags', href: '/categories/tote-bags' },
  { label: 'Suits & Kurtas', href: '/categories/suits-kurtas' },
  { label: 'Gifts Rs. 2K', href: '/collections/gifts-under-2000' },
];

export const MEGA_FALLBACK_CATEGORY_GROUPS: StorefrontNavGroup[] = [
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

export const MEGA_FALLBACK_SECONDARY_GROUPS: StorefrontNavGroup[] = [
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

export const MEGA_FALLBACK_COLLECTION_GROUPS: StorefrontNavGroup[] = [
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
