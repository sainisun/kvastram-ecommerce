import Link from 'next/link';
import { Building2, Mail, Phone, Menu } from 'lucide-react';

export function WholesaleHeader() {
  return (
    <header className="sticky top-0 z-50 bg-stone-900 text-white border-b border-stone-700">
      {/* Top Bar */}
      <div className="bg-amber-600 text-stone-900 py-2">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 text-body-xs type-bold md:px-12 lg:px-20">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Building2 size={14} />
              B2B WHOLESALE PORTAL
            </span>
            <span className="hidden md:block">
              Volume Discounts up to 40% OFF
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="mailto:wholesale@kvastram.com"
              className="hover:text-white flex items-center gap-1"
            >
              <Mail size={12} />
              <span className="hidden sm:inline">wholesale@kvastram.com</span>
            </a>
            <a
              href="tel:+1234567890"
              className="hover:text-white flex items-center gap-1"
            >
              <Phone size={12} />
              <span className="hidden sm:inline">+1 (234) 567-890</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-12 lg:h-20 lg:px-20">
        {/* Logo */}
        <Link href="/wholesale" className="flex items-center gap-3">
          <div className="text-display-md type-bold tracking-token-tight">KVASTRAM</div>
          <div className="h-8 w-px bg-stone-700"></div>
          <div className="text-body-xs uppercase tracking-token-wider text-amber-400 type-bold">
            Wholesale
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-body-sm type-medium">
          <Link
            href="/wholesale#benefits"
            className="hover:text-amber-400 transition-colors"
          >
            Benefits
          </Link>
          <Link
            href="/wholesale#pricing"
            className="hover:text-amber-400 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/wholesale#process"
            className="hover:text-amber-400 transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/wholesale#inquiry"
            className="hover:text-amber-400 transition-colors"
          >
            Get Quote
          </Link>
          <Link
            href="/"
            className="text-stone-400 hover:text-white transition-colors text-body-xs"
          >
            ← Retail Store
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <a
            href="#inquiry"
            className="hidden lg:block bg-amber-500 text-stone-900 px-6 py-2.5 text-body-xs type-bold uppercase tracking-token-wider hover:bg-amber-400 transition-colors"
          >
            Request Pricing
          </a>
          <button className="md:hidden text-white">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}

