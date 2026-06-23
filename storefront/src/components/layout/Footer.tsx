'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { PaymentIcons } from '@/components/ui/SecurityBadges';
import NewsletterForm from '@/components/NewsletterForm';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';
import { storefrontTrust } from '@/config/storefront-trust';
import { api } from '@/lib/api';

const shopLinks = [
  { label: 'New Kantha Short Kimono', href: '/collections/new-kantha-short-kimono' },
  { label: 'Vintage Kantha Jacket', href: '/collections/vintage-kantha-jacket' },
  { label: 'Velvet Suzani Jacket', href: '/collections/velvet-suzani-jacket' },
  { label: 'Velvet Long Kimono', href: '/collections/velvet-long-kimono' },
  { label: 'Tote Bags', href: '/collections/tote-bags' },
  { label: 'Gown & Dress', href: '/collections/gown-dress' },
];

const supportLinks = [
  { label: 'Track Order', href: storefrontTrust.policyRoutes.track },
  { label: 'Shipping Policy', href: storefrontTrust.policyRoutes.shipping },
  { label: 'Returns & Refunds', href: storefrontTrust.policyRoutes.returns },
  { label: 'FAQ', href: storefrontTrust.policyRoutes.faq },
  { label: 'Contact Us', href: storefrontTrust.policyRoutes.contact },
  { label: 'Privacy Policy', href: storefrontTrust.policyRoutes.privacy },
  { label: 'Terms of Service', href: storefrontTrust.policyRoutes.terms },
];

const companyLinks: { label: string; href: string; highlight?: boolean }[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Meet the Artisans', href: '/about#artisans' },
  { label: 'Blog / Journal', href: '/journal' },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/kvastram',
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
    color: 'kf-social-instagram',
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@kvastram',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01z" />
      </svg>
    ),
    color: 'kf-social-tiktok',
  },
  {
    label: 'WhatsApp',
    href: buildWhatsAppHref('Hi, I need help from Kvastram'),
    icon: MessageCircle,
    color: 'kf-social-whatsapp',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@kvastram',
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4S5.12 4 3.4 4.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19C5.12 19.46 12 19.46 12 19.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
    color: 'kf-social-youtube',
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/kvastram',
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    color: 'kf-social-facebook',
  },
  {
    label: 'Twitter / X',
    href: 'https://x.com/kvastram',
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M4 4l11.733 16H20L8.267 4z" />
        <path d="M4 20l6.768-6.768m2.46-2.46L20 4" />
      </svg>
    ),
    color: 'kf-social-twitter',
  },
];

export function Footer() {
  const [activeShopLinks, setActiveShopLinks] = useState(shopLinks);

  useEffect(() => {
    let active = true;
    Promise.all([api.getCategories(), api.getCollections()])
      .then(([categoriesData, collectionsData]) => {
        if (!active) return;
        const cats = categoriesData.categories || [];
        const cols = collectionsData.collections || [];

        const filtered = shopLinks.filter((link) => {
          if (link.href.startsWith('/collections/')) {
            const handle = link.href.replace('/collections/', '');
            const existsInCols = cols.some(
              (c: { handle?: string; status?: string }) => c.handle === handle && c.status === 'active'
            );
            const existsInCats = cats.some(
              (c: { slug?: string; is_active?: boolean }) => c.slug === handle && c.is_active !== false
            );
            return existsInCols || existsInCats;
          }
          return true; // Keep "New Arrivals" etc.
        });
        setActiveShopLinks(filtered);
      })
      .catch((err) => {
        console.warn('[Footer] Failed to load categories/collections for filter:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer data-home-section="11-footer" className="kvastram-footer border-t border-[var(--ds-footer-border)]">
      <div
        className="footer-watermark-prem overflow-hidden px-6 pt-8 sm:px-8 md:px-12 md:pt-10 select-none"
        aria-hidden="true"
      >
        Kvastram
      </div>

      <div className="kv-page-container mx-auto max-w-[1440px] px-6 pb-10 pt-10 sm:px-8 md:px-12 md:pb-12 md:pt-12 lg:px-20 lg:pt-24">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-5 col-span-2 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="block">
              <span className="kf-logo font-body text-display-sm type-semibold tracking-token-wider">
                KVASTRAM
              </span>
            </Link>
            <p className="kf-link font-body text-body-md type-light leading-token-relaxed">
              Handcrafted luxury fashion connecting global citizens with the
              finest artisanal craftsmanship from India and beyond.
            </p>
            <div className="kf-muted font-body space-y-3 text-body-xs type-light">
              <p>{storefrontTrust.supportEmail}</p>
              <p>{storefrontTrust.supportPhone}</p>
              <p>{storefrontTrust.supportHours}</p>
              <p>{storefrontTrust.locationLabel}</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map(({ label, href, icon: Icon, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`kf-social transition-colors duration-200 ${color}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Column */}
          <div className="col-span-1">
            <h4 className="kf-heading font-body mb-6 text-body-xs type-semibold tracking-token-wide uppercase">
              Shop
            </h4>
            <ul className="space-y-3">
              {activeShopLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="kf-link font-body text-body-md type-light transition-colors block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className="col-span-1">
            <h4 className="kf-heading font-body mb-6 text-body-xs type-semibold tracking-token-wide uppercase">
              Support
            </h4>
            <ul className="space-y-3">
              {supportLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="kf-link font-body text-body-md type-light transition-colors block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="col-span-1">
            <h4 className="kf-heading font-body mb-6 text-body-xs type-semibold tracking-token-wide uppercase">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map(({ label, href, highlight }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className={`font-body text-body-md transition-colors block ${
                      highlight
                        ? 'kf-highlight type-medium'
                        : 'kf-link type-light'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Updated Column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <h4 className="kf-heading font-body mb-6 text-body-xs type-semibold tracking-token-wide uppercase">
              Stay Updated
            </h4>
            <p className="kf-muted font-body mb-4 text-body-md type-light leading-token-relaxed">
              Get 10% off your first order plus early access to new collections.
            </p>
            <NewsletterForm minimal />
            <div className="kf-dim font-body mt-4 text-body-xs">
              No spam. Unsubscribe anytime.
            </div>
          </div>
        </div>
      </div>

      <div className="kf-border border-t">
        <div className="kv-page-container mx-auto max-w-[1440px] px-6 py-8 sm:px-8 md:px-12 md:py-12 lg:px-20">
          <PaymentIcons className="mb-4" />
          <div className="kf-legal font-body flex flex-col items-center justify-between gap-4 text-center text-body-xs sm:flex-row sm:text-left">
            <p>Copyright {new Date().getFullYear()} Kvastram. All rights reserved.</p>
            <div className="flex gap-6">
              <Link
                href={storefrontTrust.policyRoutes.privacy}
                className="kf-legal-link font-body transition-colors"
              >
                Privacy
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.terms}
                className="kf-legal-link font-body transition-colors"
              >
                Terms
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.cookies}
                className="kf-legal-link font-body transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
