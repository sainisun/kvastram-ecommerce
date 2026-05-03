'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { PaymentIcons } from '@/components/ui/SecurityBadges';
import NewsletterForm from '@/components/NewsletterForm';

const shopLinks = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Kantha Quilts & Throws', href: '/collections/kantha-quilts' },
  { label: 'Handmade Bags & Totes', href: '/collections/bags' },
  { label: 'Block Print Clothing', href: '/collections/block-print' },
  { label: 'Artisan Scarves & Wraps', href: '/collections/dupattas-stoles' },
  { label: 'Gifts Under $75', href: '/collections/gifts' },
  { label: 'Last Pieces — On Sale', href: '/sale' },
];

const supportLinks = [
  { label: 'Track Order', href: '/track' },
  { label: 'Shipping & Returns', href: '/pages/shipping-returns' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Size Guide', href: '/pages/size-guide' },
  { label: 'Privacy Policy', href: '/pages/privacy-policy' },
  { label: 'Terms of Service', href: '/pages/terms-of-service' },
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
  { label: 'Best Sellers', href: '/products' },
  { label: 'Collections', href: '/collections' },
  { label: 'Shawls & Wraps', href: '/collections/shawls' },
  { label: 'Kurtis & Tops', href: '/collections/kurtis' },
  { label: 'Accessories', href: '/collections/accessories' },
  { label: 'Sale', href: '/sale' },
];

const mobileHelpLinks = [
  { label: 'Track Order', href: '/track' },
  { label: 'Shipping & Returns', href: '/pages/shipping-returns' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
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
    href: 'https://wa.me/message/kvastram',
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
    <div className="hidden bg-[#1a1614] text-white md:block">
      <div className="footer-watermark-prem overflow-hidden px-12 pt-10" aria-hidden="true">
        Kvastram
      </div>

      <div className="mx-auto max-w-[1440px] px-12 pb-12 pt-12 lg:px-20 lg:pt-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-1">
            <Link href="/" className="block">
              <span className="font-body text-display-sm type-semibold uppercase tracking-token-wider text-white">
                KVASTRAM
              </span>
            </Link>
            <p className="font-body text-body-md type-light leading-token-relaxed text-stone-400">
              Handcrafted luxury fashion connecting global citizens with the
              finest artisanal craftsmanship from India and beyond.
            </p>
            <div className="font-body space-y-3 text-body-xs type-light text-stone-500">
              <p>support@kvastram.com</p>
              <p>Mon-Fri, 9am-6pm IST</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map(({ label, href, icon: Icon, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`text-stone-500 transition-colors duration-200 ${color}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-body mb-6 text-body-xs type-medium uppercase tracking-token-wide text-stone-400">
              Shop
            </h4>
            <ul className="space-y-3">
              {shopLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="font-body text-body-md type-light text-stone-400 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body mb-6 text-body-xs type-medium uppercase tracking-token-wide text-stone-400">
              Support
            </h4>
            <ul className="space-y-3">
              {supportLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="font-body text-body-md type-light text-stone-400 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body mb-6 text-body-xs type-medium uppercase tracking-token-wide text-stone-400">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map(({ label, href, highlight }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className={`font-body text-body-md transition-colors ${
                      highlight
                        ? 'type-medium text-amber-400 hover:text-amber-300'
                        : 'type-light text-stone-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body mb-6 text-body-xs type-medium uppercase tracking-token-wide text-stone-400">
              Stay Updated
            </h4>
            <p className="font-body mb-4 text-body-md type-light leading-token-relaxed text-stone-500">
              Get 10% off your first order plus early access to new collections.
            </p>
            <NewsletterForm minimal />
            <div className="font-body mt-4 text-body-xs text-stone-600">
              No spam. Unsubscribe anytime.
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-800">
        <div className="mx-auto max-w-[1440px] px-12 py-12 lg:px-20">
          <PaymentIcons className="mb-4" />
          <div className="font-body flex flex-col items-center justify-between gap-6 text-body-xs text-stone-600 sm:flex-row">
            <p>Copyright {new Date().getFullYear()} Kvastram. All rights reserved.</p>
            <div className="flex gap-6">
              <Link
                href="/pages/privacy-policy"
                className="font-body transition-colors hover:text-stone-400"
              >
                Privacy
              </Link>
              <Link
                href="/pages/terms-of-service"
                className="font-body transition-colors hover:text-stone-400"
              >
                Terms
              </Link>
              <Link
                href="/pages/cookie-policy"
                className="font-body transition-colors hover:text-stone-400"
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

