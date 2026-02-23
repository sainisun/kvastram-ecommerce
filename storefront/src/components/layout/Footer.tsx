'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { PaymentIcons } from '@/components/ui/SecurityBadges';
import NewsletterForm from '@/components/NewsletterForm';

const supportLinks = [
  { id: '1', slug: 'contact', title: 'Contact Us' },
  { id: '2', slug: 'shipping-returns', title: 'Shipping & Returns' },
  { id: '3', slug: 'faq', title: 'FAQ' },
  { id: '4', slug: 'privacy-policy', title: 'Privacy Policy' },
  { id: '5', slug: 'terms-of-service', title: 'Terms of Service' },
];

export function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tighter">KVASTRAM</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Connecting global citizens with the finest artisanal craftsmanship
              from India and beyond.
            </p>
            <div className="mt-4 space-y-1 text-sm text-stone-400">
              <p>123 Fashion Avenue, New York, NY 10001</p>
              <p>support@kvastram.com | +1 (555) 123-4567</p>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link
                  href="/products"
                  className="hover:text-white transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/products?sort=created_at"
                  className="hover:text-white transition-colors"
                >
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  className="hover:text-white transition-colors"
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/products?tag=accessories"
                  className="hover:text-white transition-colors"
                >
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link
                  href="/track"
                  className="hover:text-white transition-colors"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  href="/stores"
                  className="hover:text-white transition-colors"
                >
                  Store Locator
                </Link>
              </li>
              {supportLinks.map((page: any) => (
                <li key={page.id}>
                  <Link
                    href={`/pages/${page.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/wholesale"
                  className="hover:text-white transition-colors font-medium text-amber-400 hover:text-amber-300"
                >
                  Wholesale / Bulk Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-stone-400 hover:text-white transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-stone-400 hover:text-white transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-stone-400 hover:text-white transition-colors"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
            <p className="text-stone-400 text-sm mb-4">
              Subscribe for exclusive offers and new arrivals.
            </p>
            <NewsletterForm minimal />
          </div>
        </div>

        <div className="border-t border-stone-800 mt-16 pt-8">
          <PaymentIcons className="mb-6" />
          <p className="text-center text-sm text-stone-500">
            &copy; {new Date().getFullYear()} Kvastram. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
