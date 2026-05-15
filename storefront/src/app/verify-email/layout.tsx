import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Verify Email | Kvastram',
  description: 'Verify your email address to activate your Kvastram account.',
  path: '/verify-email',
  keywords: ['Kvastram verify email'],
});

export default function VerifyEmailLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
