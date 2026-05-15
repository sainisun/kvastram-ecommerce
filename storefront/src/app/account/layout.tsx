import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'My Account | Kvastram',
  description:
    'Manage orders, saved addresses, messages, and account details for your Kvastram purchases.',
  path: '/account',
  keywords: ['Kvastram account', 'order history', 'saved addresses'],
});

export default function AccountLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
