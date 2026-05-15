import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Track Order | Kvastram',
  description:
    'Track an existing Kvastram order and reach support quickly if you need payment or delivery help.',
  path: '/track',
  keywords: ['Kvastram track order'],
});

export default function TrackLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
