import Link from 'next/link';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ArrowRight,
} from 'lucide-react';

export function WholesaleFooter() {
  return (
    <footer className="bg-stone-900 text-white">
      {/* Main Footer */}
      <div className="border-t border-stone-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-2xl font-bold tracking-tighter">
                  KVASTRAM
                </div>
                <div className="h-6 w-px bg-stone-700"></div>
                <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                  Wholesale
                </div>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed">
                Your trusted partner for authentic artisanal luxury products.
                Serving retailers and distributors worldwide since 2020.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
                  <Building2 size={16} />
                  B2B Division
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-amber-400">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm text-stone-400">
                <li>
                  <Link
                    href="/wholesale#benefits"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Why Partner With Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#pricing"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Pricing Tiers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#process"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Ordering Process
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#inquiry"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Request Quote
                  </Link>
                </li>
                <li className="pt-2 border-t border-stone-800">
                  <Link
                    href="/"
                    className="hover:text-amber-400 transition-colors text-xs"
                  >
                    Visit Retail Store →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-amber-400">
                Resources
              </h4>
              <ul className="space-y-3 text-sm text-stone-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Download size={14} />
                    Product Catalog (PDF)
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Download size={14} />
                    Price List 2024
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <FileText size={14} />
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <FileText size={14} />
                    Shipping Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <FileText size={14} />
                    Return Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-amber-400">
                Contact B2B Team
              </h4>
              <ul className="space-y-4 text-sm text-stone-400">
                <li className="flex items-start gap-3">
                  <Mail
                    size={16}
                    className="text-amber-400 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-white font-medium mb-1">Email</div>
                    <a
                      href="mailto:wholesale@kvastram.com"
                      className="hover:text-white transition-colors"
                    >
                      wholesale@kvastram.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone
                    size={16}
                    className="text-amber-400 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-white font-medium mb-1">Phone</div>
                    <a
                      href="tel:+1234567890"
                      className="hover:text-white transition-colors"
                    >
                      +1 (234) 567-890
                    </a>
                    <div className="text-xs text-stone-500 mt-1">
                      Mon-Fri, 9AM-6PM EST
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin
                    size={16}
                    className="text-amber-400 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-white font-medium mb-1">Office</div>
                    <div className="text-stone-400">
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
      <div className="bg-black py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
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
              <Link href="#" className="hover:text-stone-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-stone-300 transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-stone-300 transition-colors">
                Trade Agreement
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-stone-950 py-8 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-stone-600 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center">
                <Building2 size={14} className="text-amber-600" />
              </div>
              <span>Verified Business</span>
            </div>
            <div className="w-px h-6 bg-stone-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center">
                <FileText size={14} className="text-amber-600" />
              </div>
              <span>ISO Certified</span>
            </div>
            <div className="w-px h-6 bg-stone-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center">
                <MapPin size={14} className="text-amber-600" />
              </div>
              <span>Global Shipping</span>
            </div>
            <div className="w-px h-6 bg-stone-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center">
                <Phone size={14} className="text-amber-600" />
              </div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
