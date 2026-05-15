import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Login | Kvastram',
  description: 'Sign in to your Kvastram account to view orders and manage support.',
  path: '/login',
  keywords: ['Kvastram login'],
});

export default function LoginLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
