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
  { label: 'Kantha Jackets', href: '/collections/kantha-jackets' },
  { label: 'Cotton Jackets', href: '/collections/cotton-jackets' },
  { label: 'Bohemian Dresses', href: '/collections/bohemian-dresses' },
  { label: 'Quilted Tote Bags', href: '/collections/quilted-bags' },
  { label: 'Kantha Quilts', href: '/collections/kantha-quilts' },
];

export const MEGA_FALLBACK_CATEGORY_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Jackets & Coats',
    items: [
      { label: 'Kantha Jackets', href: '/collections/kantha-jackets' },
      { label: 'Cotton Jackets', href: '/collections/cotton-jackets' },
      { label: 'Velvet Jackets', href: '/collections/velvet-jackets' },
      { label: 'Vintage Jackets', href: '/collections/vintage-jackets' },
      { label: 'Printed Kimonos', href: '/collections/printed-kimonos' },
      { label: 'Kimono Robes', href: '/collections/kimono-robes' },
    ],
  },
];

export const MEGA_FALLBACK_SECONDARY_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Dresses & Bags',
    items: [
      { label: 'Long Dress', href: '/collections/long-dress' },
      { label: 'Short Dress', href: '/collections/short-dress' },
      { label: 'Duffle Bags', href: '/collections/duffle-bags' },
      { label: 'Quilted Tote Bags', href: '/collections/quilted-bags' },
      { label: 'Velvet Bags', href: '/collections/velvet-bags' },
      { label: 'Toiletry Pouches', href: '/collections/toiletry-pouches' },
    ],
  },
  {
    label: 'Apparel & Home',
    items: [
      { label: 'Skirts', href: '/collections/skirts' },
      { label: 'Kitchen Aprons', href: '/collections/kitchen-aprons' },
      { label: 'Block Print Fabrics', href: '/collections/block-print-fabrics' },
      { label: 'Kantha Quilts', href: '/collections/kantha-quilts' },
      { label: 'Vintage Throws', href: '/collections/vintage-throws' },
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
