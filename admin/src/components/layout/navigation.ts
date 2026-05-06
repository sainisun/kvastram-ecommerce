import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  ClipboardList,
  FileText,
  FolderKanban,
  Globe,
  Home,
  Landmark,
  LayoutDashboard,
  ListTree,
  Megaphone,
  MessageCircleQuestion,
  Mailbox,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
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

export type DashboardMode = 'retail' | 'wholesale';

export const retailPrimaryNavItems: NavItem[] = [
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
    label: 'Content',
    href: '/dashboard/content',
    icon: Home,
    description: 'Homepage, pages, and media',
  },
  {
    label: 'Marketing',
    href: '/dashboard/marketing',
    icon: Megaphone,
    description: 'Discounts and campaigns',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Store configuration',
  },
];

export const retailMoreNavItems: NavItem[] = [
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
    label: 'Reviews',
    href: '/dashboard/reviews',
    icon: Star,
    description: 'Moderate social proof',
  },
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
    label: 'Abandoned Carts',
    href: '/dashboard/abandoned-carts',
    icon: ShoppingCart,
    description: 'Recovery automation',
  },
];

export const wholesaleNavItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard/wholesale',
    icon: Truck,
    description: 'B2B snapshot',
  },
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
  {
    label: 'Tiers',
    href: '/dashboard/wholesale/tiers',
    icon: Landmark,
    description: 'Discount programs',
  },
  {
    label: 'Page Content',
    href: '/dashboard/wholesale/page-content',
    icon: FileText,
    description: 'Wholesale landing page',
  },
  {
    label: 'Footer Links',
    href: '/dashboard/wholesale/footer-links',
    icon: FileText,
    description: 'Catalog and policy resources',
  },
];

export const primaryNavItems = retailPrimaryNavItems;
export const moreNavItems = retailMoreNavItems;

export function getDashboardMode(pathname: string): DashboardMode {
  if (
    pathname.startsWith('/dashboard/wholesale') ||
    pathname.startsWith('/dashboard/wholesale-page')
  ) {
    return 'wholesale';
  }

  return 'retail';
}

export function getNavItemsForMode(mode: DashboardMode): NavItem[] {
  if (mode === 'wholesale') {
    return wholesaleNavItems;
  }

  return [...retailPrimaryNavItems, ...retailMoreNavItems];
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/dashboard/wholesale') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
