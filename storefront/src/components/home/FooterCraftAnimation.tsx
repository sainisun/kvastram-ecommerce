import { Truck, RotateCcw, Package, HelpCircle } from 'lucide-react';
import { HomepageContainer, ButtonLink } from '@/design-system';

export function FooterCraftAnimation() {
  return (
    <section className="relative overflow-hidden bg-[var(--ds-surface-paper)] border-t border-[var(--ds-border-subtle)]" data-home-section="14-footer-animation">
      
      {/* Abstract Animated Jaipur / Craft SVG Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <pattern id="stitchPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 10 L 10 10" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stitchPattern)" className="text-[var(--ds-accent-gold)]" />
          
          <path 
            className="animate-pulse" 
            d="M 0,100 Q 150,50 300,100 T 600,100 T 900,100 T 1200,100" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.5" 
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      <HomepageContainer className="relative z-10 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-display-md text-primary mb-4">Crafted in Jaipur. Shipped Worldwide.</h2>
          <p className="font-body text-body-lg text-muted max-w-2xl mx-auto">
            From the hands of our artisans to your doorstep. We take care of every step of the journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-[var(--ds-surface-page)] border border-[var(--ds-border-subtle)] rounded-lg">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--ds-surface-soft)] text-accent mb-4">
              <Truck size={24} strokeWidth={1.5} />
            </div>
            <h3 className="font-label text-label-md text-primary mb-2">Free Global Shipping</h3>
            <p className="font-body text-body-sm text-muted">On all orders above $200 USD.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-[var(--ds-surface-page)] border border-[var(--ds-border-subtle)] rounded-lg">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--ds-surface-soft)] text-accent mb-4">
              <RotateCcw size={24} strokeWidth={1.5} />
            </div>
            <h3 className="font-label text-label-md text-primary mb-2">14-Day Returns</h3>
            <p className="font-body text-body-sm text-muted">Easy returns if the fit isn&apos;t quite right.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-[var(--ds-surface-page)] border border-[var(--ds-border-subtle)] rounded-lg">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--ds-surface-soft)] text-accent mb-4">
              <Package size={24} strokeWidth={1.5} />
            </div>
            <h3 className="font-label text-label-md text-primary mb-2">Secure Packaging</h3>
            <p className="font-body text-body-sm text-muted">Eco-friendly and waterproof sealing.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-[var(--ds-surface-page)] border border-[var(--ds-border-subtle)] rounded-lg">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--ds-surface-soft)] text-accent mb-4">
              <HelpCircle size={24} strokeWidth={1.5} />
            </div>
            <h3 className="font-label text-label-md text-primary mb-2">Need Help?</h3>
            <p className="font-body text-body-sm text-muted mb-4">Our support team is here for you.</p>
            <ButtonLink href="/faq" variant="outline" size="sm">Visit FAQ</ButtonLink>
          </div>
        </div>
      </HomepageContainer>
    </section>
  );
}
