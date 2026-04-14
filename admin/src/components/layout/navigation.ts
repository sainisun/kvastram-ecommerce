import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  Clapperboard,
  FolderKanban,
  Globe,
  Home,
  Image,
  Landmark,
  LayoutDashboard,
  ListTree,
  Megaphone,
  MessageSquareQuote,
  Package,
  PanelsTopLeft,
  RotateCcw,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: 'pendingOrders';
  description?: string;
}

export const primaryNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Store snapshot',
  },
  {
    label: 'Orders',
    href: '/dashboard/orders',
    icon: ShoppingBag,
    badge: 'pendingOrders',
    description: 'Manage fulfillment',
  },
  {
    label: 'Products',
    href: '/dashboard/products',
    icon: Package,
    description: 'Listings and inventory',
  },
  {
    label: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    description: 'Profiles and history',
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart2,
    description: 'Revenue and trends',
  },
  {
    label: 'Hero Banners',
    href: '/dashboard/content/hero-banners',
    icon: Image,
    description: 'Homepage slider',
  },
  {
    label: 'Trending Reels',
    href: '/dashboard/content/trending-reels',
    icon: Clapperboard,
    description: 'Short-form media',
  },
  {
    label: 'Coupons',
    href: '/dashboard/marketing',
    icon: Tag,
    description: 'Discounts and campaigns',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Store configuration',
  },
];

export const moreNavItems: NavItem[] = [
  {
    label: 'Collections',
    href: '/dashboard/collections',
    icon: FolderKanban,
    description: 'Curated product groups',
  },
  {
    label: 'Categories',
    href: '/dashboard/categories',
    icon: ListTree,
    description: 'Taxonomy and menus',
  },
  {
    label: 'Header Navigation',
    href: '/dashboard/header-navigation',
    icon: PanelsTopLeft,
    description: 'Header category order',
  },
  {
    label: 'Content',
    href: '/dashboard/content',
    icon: Home,
    description: 'Pages, posts, testimonials',
  },
  {
    label: 'Reviews',
    href: '/dashboard/reviews',
    icon: Star,
    description: 'Moderate social proof',
  },
  {
    label: 'Returns',
    href: '/dashboard/returns',
    icon: RotateCcw,
    description: 'Return workflows',
  },
  {
    label: 'Regions',
    href: '/dashboard/regions',
    icon: Globe,
    description: 'Markets and currencies',
  },
  {
    label: 'Wholesale',
    href: '/dashboard/wholesale',
    icon: Truck,
    description: 'B2B inquiries and orders',
  },
  {
    label: 'Wholesale Page',
    href: '/dashboard/wholesale-page',
    icon: Landmark,
    description: 'Wholesale landing page',
  },
  {
    label: 'Abandoned Carts',
    href: '/dashboard/abandoned-carts',
    icon: ShoppingCart,
    description: 'Recovery automation',
  },
  {
    label: 'Testimonials',
    href: '/dashboard/content/testimonials',
    icon: MessageSquareQuote,
    description: 'Customer stories',
  },
  {
    label: 'Marketing',
    href: '/dashboard/marketing',
    icon: Megaphone,
    description: 'Campaign manager',
  },
];

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
