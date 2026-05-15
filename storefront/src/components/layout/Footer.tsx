'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { PaymentIcons } from '@/components/ui/SecurityBadges';
import NewsletterForm from '@/components/NewsletterForm';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';
import { storefrontTrust } from '@/config/storefront-trust';

const shopLinks = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Curated Edits', href: '/edits' },
  { label: 'Kantha Quilts & Throws', href: '/collections/kantha-essentials' },
  { label: 'Handmade Bags & Totes', href: '/categories/tote-bags' },
  { label: 'Block Print Clothing', href: '/collections/block-print-edit' },
  { label: 'Artisan Scarves & Wraps', href: '/categories/scarves-wraps' },
  { label: 'Gifts Under ₹2,000', href: '/collections/gifts-under-2000' },
  { label: 'Last Pieces — On Sale', href: '/sale' },
];

const supportLinks = [
  { label: 'Help Center', href: storefrontTrust.policyRoutes.help },
  { label: 'Track Order', href: storefrontTrust.policyRoutes.track },
  { label: 'Shipping Policy', href: storefrontTrust.policyRoutes.shipping },
  { label: 'Returns & Refunds', href: storefrontTrust.policyRoutes.returns },
  { label: 'Payment Help', href: storefrontTrust.policyRoutes.paymentHelp },
  { label: 'Contact Us', href: storefrontTrust.policyRoutes.contact },
  { label: 'FAQ', href: storefrontTrust.policyRoutes.faq },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Privacy Policy', href: storefrontTrust.policyRoutes.privacy },
  { label: 'Terms of Service', href: storefrontTrust.policyRoutes.terms },
];

const companyLinks = [
  { label: 'Our Story', href: '/about' },
  { label: 'Meet the Artisans', href: '/about#artisans' },
  { label: 'What is Kantha?', href: '/journal/what-is-kantha' },
  { label: 'Slow Fashion Journal', href: '/journal' },
  { label: 'Wholesale / B2B', href: '/wholesale', highlight: true },
];

const mobileShopLinks = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Curated Edits', href: '/edits' },
  { label: 'Best Sellers', href: '/products' },
  { label: 'Collections', href: '/collections' },
  { label: 'Shawls & Wraps', href: '/categories/scarves-wraps' },
  { label: 'Kurtis & Tops', href: '/categories/suits-kurtas' },
  { label: 'Accessories', href: '/categories/accessories' },
  { label: 'Sale', href: '/sale' },
];

const mobileHelpLinks = [
  { label: 'Help Center', href: storefrontTrust.policyRoutes.help },
  { label: 'Track Order', href: storefrontTrust.policyRoutes.track },
  { label: 'Shipping Policy', href: storefrontTrust.policyRoutes.shipping },
  { label: 'Returns & Refunds', href: storefrontTrust.policyRoutes.returns },
  { label: 'Contact Us', href: storefrontTrust.policyRoutes.contact },
  { label: 'FAQ', href: storefrontTrust.policyRoutes.faq },
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
    color: 'hover:text-pink-400',
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@kvastram',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01z" />
      </svg>
    ),
    color: 'hover:text-stone-900',
  },
  {
    label: 'WhatsApp',
    href: buildWhatsAppHref('Hi, I need help from Kvastram'),
    icon: MessageCircle,
    color: 'hover:text-green-500',
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
    color: 'hover:text-red-500',
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
    color: 'hover:text-blue-500',
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
    color: 'hover:text-sky-500',
  },
];

function MobileFooter() {
  return (
    <div className="bg-[#f5f0eb] md:hidden">
      <div className="grid grid-cols-2 gap-8 px-6 py-16">
        <div>
          <h4 className="mb-6 text-body-xs type-semibold uppercase tracking-token-wide text-stone-700">
            Shop
          </h4>
          <div className="space-y-3">
            {mobileShopLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="block text-body-md type-regular leading-token-relaxed text-stone-900 transition-colors hover:text-stone-600"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-6 text-body-xs type-semibold uppercase tracking-token-wide text-stone-700">
            Help
          </h4>
          <div className="space-y-3">
            {mobileHelpLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="block text-body-md type-regular leading-token-relaxed text-stone-900 transition-colors hover:text-stone-600"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200 px-6 py-6">
        <div className="flex items-center justify-center gap-4 text-stone-500">
          {socialLinks.slice(0, 3).map(({ label, href, icon: Icon, color }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={`transition-colors ${color}`}
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
        <p className="mt-4 text-center text-body-xs text-stone-500">
          Copyright {new Date().getFullYear()} Kvastram. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function DesktopFooter() {
  return (
    <div className="kvastram-footer hidden bg-[#1a1614] text-[#f8f3ec] md:block">
      <div
        className="footer-watermark-prem overflow-hidden px-6 pt-8 sm:px-8 md:px-12 md:pt-10"
        aria-hidden="true"
      >
        Kvastram
      </div>

      <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-10 sm:px-8 md:px-12 md:pb-12 md:pt-12 lg:px-20 lg:pt-24">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          <div className="space-y-5 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="block">
              <span className="kf-logo font-body text-display-sm type-semibold uppercase tracking-token-wider text-white">
                KVASTRAM
              </span>
            </Link>
            <p className="kf-link font-body text-body-md type-light leading-token-relaxed text-[#d8d0c7]">
              Handcrafted luxury fashion connecting global citizens with the
              finest artisanal craftsmanship from India and beyond.
            </p>
            <div className="kf-muted font-body space-y-3 text-body-xs type-light text-[#c9beb3]">
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
                  className={`kf-social text-[#d8d0c7] transition-colors duration-200 ${color}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="kf-heading font-body mb-6 text-body-xs type-medium uppercase tracking-token-wide text-[#efe7dd]">
              Shop
            </h4>
            <ul className="space-y-3">
              {shopLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="kf-link font-body text-body-md type-light text-[#d8d0c7] transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="kf-heading font-body mb-6 text-body-xs type-medium uppercase tracking-token-wide text-[#efe7dd]">
              Support
            </h4>
            <ul className="space-y-3">
              {supportLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="kf-link font-body text-body-md type-light text-[#d8d0c7] transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="kf-heading font-body mb-6 text-body-xs type-medium uppercase tracking-token-wide text-[#efe7dd]">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map(({ label, href, highlight }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className={`font-body text-body-md transition-colors ${
                      highlight
                        ? 'kf-highlight type-medium text-[#f0c36b] hover:text-[#ffd98e]'
                        : 'kf-link type-light text-[#d8d0c7] hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="kf-heading font-body mb-6 text-body-xs type-medium uppercase tracking-token-wide text-[#efe7dd]">
              Stay Updated
            </h4>
            <p className="kf-muted font-body mb-4 text-body-md type-light leading-token-relaxed text-[#c9beb3]">
              Get 10% off your first order plus early access to new collections.
            </p>
            <NewsletterForm minimal />
            <div className="kf-dim font-body mt-4 text-body-xs text-[#b8aca0]">
              No spam. Unsubscribe anytime.
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#3a3029]">
        <div className="mx-auto max-w-[1440px] px-6 py-8 sm:px-8 md:px-12 md:py-12 lg:px-20">
          <PaymentIcons className="mb-4" />
          <div className="kf-legal font-body flex flex-col items-center justify-between gap-4 text-center text-body-xs text-[#c9beb3] sm:flex-row sm:text-left">
            <p>Copyright {new Date().getFullYear()} Kvastram. All rights reserved.</p>
            <div className="flex gap-6">
              <Link
                href={storefrontTrust.policyRoutes.privacy}
                className="kf-legal-link font-body transition-colors hover:text-white"
              >
                Privacy
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.terms}
                className="kf-legal-link font-body transition-colors hover:text-white"
              >
                Terms
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.cookies}
                className="kf-legal-link font-body transition-colors hover:text-white"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer>
      <MobileFooter />
      <DesktopFooter />
    </footer>
  );
}
