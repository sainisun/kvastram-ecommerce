import Link from 'next/link';
import { Building2, Mail, Phone, Menu } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';

export function WholesaleHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--ds-text-primary)] text-[var(--ds-text-inverse)] border-b border-[var(--ds-text-secondary)]">
      {/* Top Bar */}
      <div className="bg-[var(--ds-warning)] text-[var(--ds-text-primary)] py-2">
        <div className="kv-page-container mx-auto flex max-w-[1440px] items-center justify-between px-6 text-body-xs type-bold md:px-12 lg:px-20">
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
              className="hover:text-[var(--ds-text-inverse)] flex items-center gap-1"
            >
              <Mail size={12} />
              <span className="hidden sm:inline">wholesale@kvastram.com</span>
            </a>
            <a
              href="tel:+1234567890"
              className="hover:text-[var(--ds-text-inverse)] flex items-center gap-1"
            >
              <Phone size={12} />
              <span className="hidden sm:inline">+1 (234) 567-890</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="kv-page-container mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-12 lg:h-20 lg:px-20">
        {/* Logo */}
        <Link href="/wholesale" className="flex items-center gap-3">
          <div className="text-display-md type-bold tracking-token-tight">KVASTRAM</div>
          <div className="h-8 w-px bg-[var(--ds-text-secondary)]"></div>
          <div className="text-body-xs  tracking-token-wider text-[var(--ds-accent-gold)] type-bold">
            Wholesale
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-body-sm type-medium">
          <Link
            href="/wholesale#benefits"
            className="hover:text-[var(--ds-accent-gold)] transition-colors"
          >
            Benefits
          </Link>
          <Link
            href="/wholesale#pricing"
            className="hover:text-[var(--ds-accent-gold)] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/wholesale#process"
            className="hover:text-[var(--ds-accent-gold)] transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/wholesale#inquiry"
            className="hover:text-[var(--ds-accent-gold)] transition-colors"
          >
            Get Quote
          </Link>
          <Link
            href="/"
            className="text-[var(--ds-text-muted)] hover:text-[var(--ds-text-inverse)] transition-colors text-body-xs"
          >
            ← Retail Store
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <a
            href="#inquiry"
            className="hidden lg:block bg-[var(--ds-warning)] text-[var(--ds-text-primary)] px-6 py-2.5 text-body-xs type-bold  tracking-token-wider hover:bg-[var(--ds-accent-gold)] transition-colors"
          >
            Request Pricing
          </a>
          <IconButton
            type="button"
            variant="ghost"
            size="md"
            className="text-[var(--ds-text-inverse)] md:hidden"
            aria-label="Open wholesale navigation"
          >
            <Menu size={24} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
