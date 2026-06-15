import Link from 'next/link';
import { HelpCircle, MessageCircle, PackageCheck, Ruler, Shirt, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

function whatsappHref(message: string) {
  return `https://wa.me/message/kvastram?text=${encodeURIComponent(message)}&utm_source=homepage&utm_medium=cta`;
}

export function WhatsAppHelpStrip() {
  return (
    <section className="home-help-strip" aria-label="Product help">
      <div className="kv-container home-help-strip-inner">
        <div>
          <span>Need size, fabric, or more photos?</span>
          <p>Ask before you buy. It is especially useful for jackets, kimonos, bags, and gifts.</p>
        </div>
        <ButtonLink
          href={whatsappHref('Hi, I need help choosing a Kvastram piece')}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="md"
        >
          Message on WhatsApp
        </ButtonLink>
      </div>
    </section>
  );
}

const craftCards = [
  {
    icon: Sparkles,
    title: 'What is Kantha?',
    copy: 'Understand the layered stitch language behind Kvastram quilted pieces.',
    href: '/about/kantha',
  },
  {
    icon: Shirt,
    title: 'Why block print varies',
    copy: 'Small variations are part of hand block printed textile character.',
    href: '/about/block-printing',
  },
  {
    icon: PackageCheck,
    title: 'Care for quilted cotton',
    copy: 'Read how to handle, wash, and store handmade textile pieces.',
    href: '/about/our-craft',
  },
];

export function CraftEducationStrip() {
  return (
    <section className="kv-section craft-education-section bg-[var(--ds-surface-paper)]">
      <div className="kv-container">
        <div className="craft-education-grid">
          {craftCards.map(({ icon: Icon, title, copy, href }) => (
            <Link key={title} href={href} className="craft-education-card">
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FitScaleHelp() {
  return (
    <section className="kv-section fit-help-section bg-[var(--ds-surface-parchment)]">
      <div className="kv-container fit-help-inner">
        <div>
          <div className="kv-tag">Fit &amp; scale help</div>
          <h2 className="kv-title">Unsure about fit or size?</h2>
          <p className="kv-sub mt-3">
            See pieces in motion, check measurements, or ask for extra photos before checkout.
          </p>
        </div>
        <div className="fit-help-actions">
          <ButtonLink href="/reels" variant="primary" size="md">
            Watch fit reels
          </ButtonLink>
          <ButtonLink
            href={whatsappHref('Hi, I need sizing help for a Kvastram product')}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="md"
          >
            WhatsApp help
          </ButtonLink>
          <ButtonLink href="/size-guide" variant="outline" size="md">
            Size guide
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

const faqItems = [
  {
    icon: PackageCheck,
    title: 'Where do products ship from?',
    copy: 'Kvastram ships from Jaipur, Rajasthan, India.',
  },
  {
    icon: HelpCircle,
    title: 'How long does delivery take?',
    copy: 'Delivery timing depends on location and shipping method. Check shipping guidance before checkout.',
  },
  {
    icon: Ruler,
    title: 'Can I exchange?',
    copy: 'Eligible exchange and return support is handled through the Kvastram returns flow.',
  },
  {
    icon: MessageCircle,
    title: 'Need help before buying?',
    copy: 'Use WhatsApp for sizing, gifting, fabric, and product photo questions.',
  },
];

export function ShippingReturnsMiniFAQ() {
  return (
    <section className="kv-section mini-faq-section bg-[var(--ds-surface-paper)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">Before checkout</div>
            <h2 className="kv-title">Shipping and support, answered quickly</h2>
          </div>
          <Link href="/returns" className="kv-section-link">
            Returns Help
          </Link>
        </div>
        <div className="mini-faq-grid">
          {faqItems.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="mini-faq-card">
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
