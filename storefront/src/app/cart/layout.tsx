import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Cart | Kvastram',
  description:
    'Review your Kvastram cart, shipping guidance, and payment help before checkout.',
  path: '/cart',
  keywords: ['Kvastram cart'],
});

export default function CartLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
