import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ArrowRight,
} from 'lucide-react';

interface FooterSettings {
  wholesale_footer_catalog_link?: string;
  wholesale_footer_price_list_link?: string;
  wholesale_footer_terms_link?: string;
  wholesale_footer_shipping_link?: string;
  wholesale_footer_return_link?: string;
}

export function WholesaleFooter() {
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({});

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const data = await api.getFooterSettings();
        if (data.settings) {
          setFooterSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error);
      }
    };

    fetchFooterSettings();
  }, []);

  return (
    <footer className="bg-[var(--ds-text-primary)] text-[var(--ds-text-inverse)]">
      {/* Main Footer */}
      <div className="border-t border-[var(--ds-text-secondary)] py-12 md:py-16 lg:py-24">
        <div className="kv-page-container mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-display-md type-bold tracking-token-tight">
                  KVASTRAM
                </div>
                <div className="h-6 w-px bg-[var(--ds-text-secondary)]"></div>
                <div className="text-body-xs uppercase tracking-token-wider text-[var(--ds-accent-gold)] type-bold">
                  Wholesale
                </div>
              </div>
              <p className="text-body-sm text-[var(--ds-text-muted)] leading-token-relaxed">
                Your trusted partner for authentic artisanal luxury products.
                Serving retailers and distributors worldwide since 2020.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 text-body-xs text-[var(--ds-accent-gold)] type-bold uppercase tracking-token-wider">
                  <Building2 size={16} />
                  B2B Division
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-body-sm type-bold uppercase tracking-token-wider mb-6 text-[var(--ds-accent-gold)]">
                Quick Links
              </h4>
              <ul className="space-y-3 text-body-sm text-[var(--ds-text-muted)]">
                <li>
                  <Link
                    href="/wholesale#benefits"
                    className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Why Partner With Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#pricing"
                    className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Pricing Tiers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#process"
                    className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Ordering Process
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#inquiry"
                    className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Request Quote
                  </Link>
                </li>
                <li className="pt-2 border-t border-[var(--ds-text-secondary)]">
                  <Link
                    href="/"
                    className="hover:text-[var(--ds-accent-gold)] transition-colors text-body-xs"
                  >
                    Visit Retail Store →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-body-sm type-bold uppercase tracking-token-wider mb-6 text-[var(--ds-accent-gold)]">
                Resources
              </h4>
              <ul className="space-y-3 text-body-sm text-[var(--ds-text-muted)]">
                <li>
                  {footerSettings.wholesale_footer_catalog_link ? (
                    <a
                      href={footerSettings.wholesale_footer_catalog_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                    >
                      <Download size={14} />
                      Product Catalog (PDF)
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 opacity-50">
                      <Download size={14} />
                      Product Catalog (PDF)
                    </span>
                  )}
                </li>
                <li>
                  {footerSettings.wholesale_footer_price_list_link ? (
                    <a
                      href={footerSettings.wholesale_footer_price_list_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                    >
                      <Download size={14} />
                      Price List
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 opacity-50">
                      <Download size={14} />
                      Price List
                    </span>
                  )}
                </li>
                <li>
                  {footerSettings.wholesale_footer_terms_link ? (
                    <a
                      href={footerSettings.wholesale_footer_terms_link}
                      className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} />
                      Terms & Conditions
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 opacity-50">
                      <FileText size={14} />
                      Terms & Conditions
                    </span>
                  )}
                </li>
                <li>
                  {footerSettings.wholesale_footer_shipping_link ? (
                    <a
                      href={footerSettings.wholesale_footer_shipping_link}
                      className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} />
                      Shipping Policy
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 opacity-50">
                      <FileText size={14} />
                      Shipping Policy
                    </span>
                  )}
                </li>
                <li>
                  {footerSettings.wholesale_footer_return_link ? (
                    <a
                      href={footerSettings.wholesale_footer_return_link}
                      className="hover:text-[var(--ds-text-inverse)] transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} />
                      Return Policy
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 opacity-50">
                      <FileText size={14} />
                      Return Policy
                    </span>
                  )}
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-body-sm type-bold uppercase tracking-token-wider mb-6 text-[var(--ds-accent-gold)]">
                Contact B2B Team
              </h4>
              <ul className="space-y-4 text-body-sm text-[var(--ds-text-muted)]">
                <li className="flex items-start gap-3">
                  <Mail
                    size={16}
                    className="text-[var(--ds-accent-gold)] mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-[var(--ds-text-inverse)] type-medium mb-1">Email</div>
                    <a
                      href="mailto:wholesale@kvastram.com"
                      className="hover:text-[var(--ds-text-inverse)] transition-colors"
                    >
                      wholesale@kvastram.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone
                    size={16}
                    className="text-[var(--ds-accent-gold)] mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-[var(--ds-text-inverse)] type-medium mb-1">Phone</div>
                    <a
                      href="tel:+1234567890"
                      className="hover:text-[var(--ds-text-inverse)] transition-colors"
                    >
                      +1 (234) 567-890
                    </a>
                    <div className="text-body-xs text-[var(--ds-text-muted)] mt-1">
                      Mon-Fri, 9AM-6PM EST
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin
                    size={16}
                    className="text-[var(--ds-accent-gold)] mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-[var(--ds-text-inverse)] type-medium mb-1">Office</div>
                    <div className="text-[var(--ds-text-muted)]">
                      123 Business District
                      <br />
                      New York, NY 10001
                      <br />
                      United States
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[var(--ds-text-primary)] py-6">
        <div className="kv-page-container mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-body-xs text-[var(--ds-text-muted)]">
            <div className="flex items-center gap-6">
              <span>
                &copy; {new Date().getFullYear()} Kvastram Wholesale. All rights
                reserved.
              </span>
              <span className="hidden md:block">|</span>
              <span className="hidden md:block">
                Registered Business Entity
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-[var(--ds-text-disabled)] transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-[var(--ds-text-disabled)] transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-[var(--ds-text-disabled)] transition-colors">
                Trade Agreement
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-[var(--ds-text-primary)] py-8 border-t border-[var(--ds-text-primary)]">
        <div className="kv-page-container mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <div className="flex flex-wrap items-center justify-center gap-8 text-[var(--ds-text-secondary)] text-body-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--ds-text-secondary)] rounded-full flex items-center justify-center">
                <Building2 size={14} className="text-[var(--ds-warning)]" />
              </div>
              <span>Verified Business</span>
            </div>
            <div className="w-px h-6 bg-[var(--ds-text-secondary)]"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--ds-text-secondary)] rounded-full flex items-center justify-center">
                <FileText size={14} className="text-[var(--ds-warning)]" />
              </div>
              <span>ISO Certified</span>
            </div>
            <div className="w-px h-6 bg-[var(--ds-text-secondary)]"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--ds-text-secondary)] rounded-full flex items-center justify-center">
                <MapPin size={14} className="text-[var(--ds-warning)]" />
              </div>
              <span>Global Shipping</span>
            </div>
            <div className="w-px h-6 bg-[var(--ds-text-secondary)]"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--ds-text-secondary)] rounded-full flex items-center justify-center">
                <Phone size={14} className="text-[var(--ds-warning)]" />
              </div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

