import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Create Account | Kvastram',
  description:
    'Create a Kvastram account to track orders, save addresses, and manage post-purchase support.',
  path: '/register',
  keywords: ['Kvastram register', 'create account'],
});

export default function RegisterLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
