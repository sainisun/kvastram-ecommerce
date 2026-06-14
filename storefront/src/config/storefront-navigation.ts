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
  { label: 'Kantha Jackets', href: '/categories/kantha-jackets' },
  { label: 'Bohemian Dresses', href: '/categories/bohemian-dresses' },
  { label: 'Quilted Bags', href: '/categories/quilted-bags' },
  { label: 'Kantha Quilts', href: '/categories/kantha-quilts' },
  { label: 'Block Print Fabrics', href: '/categories/block-print-fabrics' },
];

export const MEGA_FALLBACK_CATEGORY_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Jackets & Robes',
    items: [
      { label: 'Kantha Jackets', href: '/categories/kantha-jackets' },
      { label: 'Velvet Suzani Jackets', href: '/categories/velvet-suzani-jackets' },
      { label: 'Printed Kimonos', href: '/categories/printed-kimonos' },
      { label: 'Bohemian Dresses', href: '/categories/bohemian-dresses' },
      { label: 'Kimono Robes', href: '/categories/kimono-robes' },
    ],
  },
];

export const MEGA_FALLBACK_SECONDARY_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Bags & Accessories',
    items: [
      { label: 'Quilted Tote Bags', href: '/categories/quilted-bags' },
      { label: 'Toiletry Pouches', href: '/categories/toiletry-pouches' },
      { label: 'Velvet Bags', href: '/categories/velvet-bags' },
    ],
  },
  {
    label: 'Textiles & Home',
    items: [
      { label: 'Block Print Fabrics', href: '/categories/block-print-fabrics' },
      { label: 'Kantha Quilts', href: '/categories/kantha-quilts' },
      { label: 'Vintage Throws', href: '/categories/vintage-throws' },
    ],
  },
];

export const MEGA_FALLBACK_COLLECTION_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Collections',
    items: [
      { label: 'Kantha Essentials', href: '/collections/kantha-essentials' },
      { label: 'Indigo Dye Edit', href: '/collections/indigo-dye-edit' },
      { label: 'Handcrafted Gifts', href: '/collections/gifts' },
      { label: 'Block Print Edit', href: '/collections/block-print-edit' },
      { label: 'New Arrivals', href: '/products?sort=newest', isNew: true },
    ],
  },
];
