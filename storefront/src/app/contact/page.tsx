import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHero } from '@/components/content/ContentPageSystem';
import { ContactClient } from './ContactClient';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Contact Kvastram | Customer Support & Jaipur Atelier',
  description:
    'Contact Kvastram for sizing questions, order tracking, payment help, returns, WhatsApp support, and Jaipur atelier enquiries.',
  path: '/contact',
  keywords: ['Kvastram contact', 'Kvastram support', 'Kvastram WhatsApp'],
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Concierge"
        title="Contact Kvastram"
        intro="Questions about sizing, payments, order tracking, returns, or atelier visits reach the same Jaipur support desk."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Contact' },
        ]}
      />
      <Suspense
        fallback={<div className="min-h-screen bg-[var(--ds-surface-paper)] py-12 md:py-16 lg:py-24" />}
      >
        <ContactClient />
      </Suspense>
    </>
  );
}
