import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  BellRing,
  ClipboardList,
  Clapperboard,
  FileText,
  FolderKanban,
  Globe,
  Image,
  Landmark,
  Layers,
  LayoutDashboard,
  ListTree,
  Mailbox,
  Megaphone,
  MessageCircleQuestion,
  MessageSquareQuote,
  Package,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
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

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export type DashboardMode = 'retail' | 'wholesale';

export const retailNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Store snapshot',
      },
      {
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart2,
        description: 'Revenue and trends',
      },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        label: 'Orders',
        href: '/dashboard/orders',
        icon: ShoppingBag,
        badge: 'pendingOrders',
        description: 'Manage fulfillment',
      },
      {
        label: 'Fulfillment',
        href: '/dashboard/fulfillment',
        icon: Truck,
        description: 'Post-order queue',
      },
      {
        label: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        description: 'Profiles and history',
      },
      {
        label: 'Returns',
        href: '/dashboard/returns',
        icon: RotateCcw,
        description: 'Return workflows',
      },
    ],
  },
  {
    label: 'Catalog',
    items: [
      {
        label: 'Products',
        href: '/dashboard/products',
        icon: Package,
        description: 'Listings and inventory',
      },
      {
        label: 'Categories',
        href: '/dashboard/categories',
        icon: ListTree,
        description: 'Taxonomy and menus',
      },
      {
        label: 'Collections',
        href: '/dashboard/collections',
        icon: FolderKanban,
        description: 'Curated product groups',
      },
      {
        label: 'Tags',
        href: '/dashboard/tags',
        icon: Tag,
        description: 'Product filters and labels',
      },
      {
        label: 'Reviews',
        href: '/dashboard/reviews',
        icon: Star,
        description: 'Moderate social proof',
      },
      {
        label: 'Regions',
        href: '/dashboard/regions',
        icon: Globe,
        description: 'Markets and currencies',
      },
    ],
  },
  {
    label: 'Storefront Content',
    items: [
      {
        label: 'Hero Banners',
        href: '/dashboard/content/hero-banners',
        icon: Image,
        description: 'Homepage slider',
      },
      {
        label: 'Homepage Banners',
        href: '/dashboard/content/homepage-banners',
        icon: Layers,
        description: 'Homepage hero/banner slider',
      },
      {
        label: 'Homepage Categories',
        href: '/dashboard/content/homepage-categories',
        icon: Layers,
        description: 'Homepage browse-by-category cards',
      },
      {
        label: 'Category Circles',
        href: '/dashboard/content/category-circles',
        icon: LayoutDashboard,
        description: 'Mobile hero circle shortcuts',
      },
      {
        label: 'Featured Products',
        href: '/dashboard/content/featured-products',
        icon: Sparkles,
        description: 'Spotlight product placements',
      },
      {
        label: 'Trending Reels',
        href: '/dashboard/content/trending-reels',
        icon: Clapperboard,
        description: 'Short-form media',
      },
      {
        label: 'Pages',
        href: '/dashboard/content/pages',
        icon: FileText,
        description: 'Storefront static pages',
      },
      {
        label: 'Posts',
        href: '/dashboard/content/posts',
        icon: FileText,
        description: 'Blog and SEO content',
      },
      {
        label: 'Testimonials',
        href: '/dashboard/content/testimonials',
        icon: MessageSquareQuote,
        description: 'Customer stories',
      },
    ],
  },
  {
    label: 'Marketing',
    items: [
      {
        label: 'Coupons',
        href: '/dashboard/marketing',
        icon: Megaphone,
        description: 'Discounts and campaigns',
      },
      {
        label: 'Abandoned Carts',
        href: '/dashboard/abandoned-carts',
        icon: ShoppingCart,
        description: 'Recovery automation',
      },
      {
        label: 'Back in Stock',
        href: '/dashboard/marketing/back-in-stock',
        icon: BellRing,
        description: 'Restock subscription alerts',
      },
    ],
  },
  {
    label: 'Support',
    items: [
      {
        label: 'Studio Inquiries',
        href: '/dashboard/studio-inquiries',
        icon: MessageCircleQuestion,
        description: 'Product questions and sizing',
      },
      {
        label: 'Support Inbox',
        href: '/dashboard/support',
        icon: Mailbox,
        description: 'Contact and order help requests',
      },
      {
        label: 'Security Events',
        href: '/dashboard/security-events',
        icon: ShieldAlert,
        description: 'Abuse and security signals',
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        description: 'Store configuration',
      },
    ],
  },
];

export const wholesaleNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard/wholesale',
        icon: Truck,
        description: 'B2B snapshot',
      },
    ],
  },
  {
    label: 'B2B Sales',
    items: [
      {
        label: 'Inquiries',
        href: '/dashboard/wholesale/inquiries',
        icon: ClipboardList,
        description: 'Applications and approvals',
      },
      {
        label: 'Customers',
        href: '/dashboard/wholesale/customers',
        icon: Users,
        description: 'Approved wholesale accounts',
      },
      {
        label: 'Orders',
        href: '/dashboard/wholesale/orders',
        icon: ShoppingBag,
        description: 'B2B order queue',
      },
    ],
  },
  {
    label: 'Pricing',
    items: [
      {
        label: 'Tiers',
        href: '/dashboard/wholesale/tiers',
        icon: Landmark,
        description: 'Discount programs',
      },
    ],
  },
  {
    label: 'Wholesale Content',
    items: [
      {
        label: 'Page Content',
        href: '/dashboard/wholesale/page-content',
        icon: FileText,
        description: 'Wholesale landing page',
      },
      {
        label: 'Footer Resources',
        href: '/dashboard/wholesale/footer-links',
        icon: FileText,
        description: 'Wholesale PDF and policy links',
      },
    ],
  },
];

export const retailPrimaryNavItems = retailNavGroups[0].items;
export const retailMoreNavItems = retailNavGroups.slice(1).flatMap((group) => group.items);
export const wholesaleNavItems = wholesaleNavGroups.flatMap((group) => group.items);
export const primaryNavItems = retailPrimaryNavItems;
export const moreNavItems = retailMoreNavItems;

export function getDashboardMode(pathname: string): DashboardMode {
  if (
    pathname.startsWith('/dashboard/wholesale') ||
    pathname.startsWith('/dashboard/wholesale-page') ||
    pathname === '/dashboard/settings/tiers' ||
    pathname === '/dashboard/content/footer-links'
  ) {
    return 'wholesale';
  }

  return 'retail';
}

export function getNavItemsForMode(mode: DashboardMode): NavItem[] {
  if (mode === 'wholesale') {
    return wholesaleNavItems;
  }

  return retailNavGroups.flatMap((group) => group.items);
}

export function getNavGroupsForMode(mode: DashboardMode): NavGroup[] {
  if (mode === 'wholesale') {
    return wholesaleNavGroups;
  }

  return retailNavGroups;
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/dashboard/wholesale') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
