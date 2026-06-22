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
  { label: 'Cotton Jackets', href: '/categories/cotton-jackets' },
  { label: 'Bohemian Dresses', href: '/categories/bohemian-dresses' },
  { label: 'Quilted Tote Bags', href: '/categories/quilted-bags' },
  { label: 'Kantha Quilts', href: '/categories/kantha-quilts' },
];

export const MEGA_FALLBACK_CATEGORY_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Jackets & Coats',
    items: [
      { label: 'Kantha Jackets', href: '/categories/kantha-jackets' },
      { label: 'Cotton Jackets', href: '/categories/cotton-jackets' },
      { label: 'Velvet Jackets', href: '/categories/velvet-jackets' },
      { label: 'Vintage Jackets', href: '/categories/vintage-jackets' },
      { label: 'Printed Kimonos', href: '/categories/printed-kimonos' },
      { label: 'Kimono Robes', href: '/categories/kimono-robes' },
    ],
  },
];

export const MEGA_FALLBACK_SECONDARY_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Dresses & Bags',
    items: [
      { label: 'Long Dress', href: '/categories/long-dress' },
      { label: 'Short Dress', href: '/categories/short-dress' },
      { label: 'Duffle Bags', href: '/categories/duffle-bags' },
      { label: 'Quilted Tote Bags', href: '/categories/quilted-bags' },
      { label: 'Velvet Bags', href: '/categories/velvet-bags' },
      { label: 'Toiletry Pouches', href: '/categories/toiletry-pouches' },
    ],
  },
  {
    label: 'Apparel & Home',
    items: [
      { label: 'Skirts', href: '/categories/skirts' },
      { label: 'Kitchen Aprons', href: '/categories/kitchen-aprons' },
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
      { label: 'Velvet Luxe Collection', href: '/collections/velvet-luxe' },
      { label: 'Kantha Essentials', href: '/collections/kantha-essentials' },
      { label: 'Indigo Dye Edit', href: '/collections/indigo-dye-edit' },
      { label: 'Handcrafted Gifts', href: '/collections/gifts' },
      { label: 'Block Print Edit', href: '/collections/block-print-edit' },
      { label: 'New Arrivals', href: '/products?sort=newest', isNew: true },
    ],
  },
];
