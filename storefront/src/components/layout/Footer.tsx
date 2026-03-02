'use client';

import Link from 'next/link';
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  MessageCircle,
} from 'lucide-react';
import { PaymentIcons } from '@/components/ui/SecurityBadges';
import NewsletterForm from '@/components/NewsletterForm';

const shopLinks = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Best Sellers', href: '/products?sort=created_at' },
  { label: 'Collections', href: '/collections' },
  { label: 'Shawls & Wraps', href: '/products?category=shawls' },
  { label: 'Kurtis & Tops', href: '/products?category=kurtis' },
  { label: 'Accessories', href: '/products?tag=accessories' },
  { label: 'Sale', href: '/sale' },
];

const supportLinks = [
  { label: 'Track Order', href: '/track' },
  { label: 'Shipping & Returns', href: '/pages/shipping-returns' },
  { label: 'Contact Us', href: '/pages/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Size Guide', href: '/pages/size-guide' },
  { label: 'Privacy Policy', href: '/pages/privacy-policy' },
  { label: 'Terms of Service', href: '/pages/terms-of-service' },
];

const companyLinks = [
  { label: 'About Kvastram', href: '/about' },
  { label: 'Our Artisans', href: '/about#artisans' },
  { label: 'Sustainability', href: '/about#sustainability' },
  { label: 'Journal', href: '/journal' },
  { label: 'Store Locator', href: '/stores' },
  { label: 'Wholesale / B2B', href: '/wholesale', highlight: true },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/kvastram',
    icon: Instagram,
    color: 'hover:text-pink-400',
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@kvastram',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01z" />
      </svg>
    ),
    color: 'hover:text-white',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/message/kvastram',
    icon: MessageCircle,
    color: 'hover:text-green-400',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@kvastram',
    icon: Youtube,
    color: 'hover:text-red-400',
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/kvastram',
    icon: Facebook,
    color: 'hover:text-blue-400',
  },
  {
    label: 'Twitter / X',
    href: 'https://x.com/kvastram',
    icon: Twitter,
    color: 'hover:text-sky-400',
  },
];

export function Footer() {
  return (
    <footer className="bg-[#1a1614] text-white">
      {/* Watermark — giant ghost text */}
      <div
        className="footer-watermark-prem"
        style={{ padding: '40px 48px 0', overflow: 'hidden' }}
        aria-hidden="true"
      >
        Kvastram
      </div>

      {/* Top section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-5">
            <Link href="/" className="block">
              <span className="font-serif text-2xl tracking-[0.2em] text-white font-light">
                KVASTRAM
              </span>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed font-light">
              Handcrafted luxury fashion connecting global citizens with the
              finest artisanal craftsmanship from India and beyond.
            </p>
            <div className="space-y-1 text-xs text-stone-500 font-light">
              <p>support@kvastram.com</p>
              <p>Mon–Fri, 9am–6pm IST</p>
            </div>
            {/* Social icons */}
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

          {/* Shop */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-5">
              Shop
            </h4>
            <ul className="space-y-2.5">
              {shopLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-stone-400 hover:text-white transition-colors font-light"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-5">
              Support
            </h4>
            <ul className="space-y-2.5">
              {supportLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-stone-400 hover:text-white transition-colors font-light"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-5">
              Company
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map(({ label, href, highlight }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className={`text-sm transition-colors font-light ${
                      highlight
                        ? 'text-amber-400 hover:text-amber-300 font-medium'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter mini */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-5">
              Stay Updated
            </h4>
            <p className="text-stone-500 text-sm font-light mb-4 leading-relaxed">
              Get 10% off your first order + early access to new collections.
            </p>
            <NewsletterForm minimal />
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-stone-600">
              <span>🔒</span>
              <span>No spam. Unsubscribe anytime.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <PaymentIcons className="mb-4" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
            <p>© {new Date().getFullYear()} Kvastram. All rights reserved.</p>
            <div className="flex gap-4">
              <Link
                href="/pages/privacy-policy"
                className="hover:text-stone-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/pages/terms-of-service"
                className="hover:text-stone-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/pages/cookie-policy"
                className="hover:text-stone-400 transition-colors"
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
