import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Kvastram Wholesale | B2B Partnership',
  description:
    'Partner with Kvastram for wholesale and bulk orders. Exclusive pricing for retailers and distributors worldwide.',
};

export default function WholesaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)]">
        {children}
      </body>
    </html>
  );
}
