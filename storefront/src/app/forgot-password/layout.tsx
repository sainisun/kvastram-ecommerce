import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Forgot Password | Kvastram',
  description: 'Request a password reset link for your Kvastram account.',
  path: '/forgot-password',
  keywords: ['Kvastram forgot password'],
});

export default function ForgotPasswordLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
