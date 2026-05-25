import Link from 'next/link';
import { Globe2, Hand, MessageCircle, ShieldCheck } from 'lucide-react';

const promises = [
  {
    icon: Hand,
    title: 'Only sellable pieces make it online',
    copy: 'Every homepage piece needs real media, clear price, and enough detail to shop with confidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest photos and clear details',
    copy: 'Texture, fabric, color, and handmade variation should be visible before you open the product page.',
  },
  {
    icon: Globe2,
    title: 'Small-batch, not mass-produced',
    copy: 'Kantha, block print, and quilted cotton pieces are selected as limited textile edits.',
  },
  {
    icon: MessageCircle,
    title: 'Sizing and gift help on WhatsApp',
    copy: 'Ask for extra photos, measurements, styling help, or gifting guidance before checkout.',
  },
];

export function CraftPromise() {
  return (
    <section className="kv-section craft-promise-section">
      <div className="kv-container craft-promise-grid">
        <div className="craft-promise-copy">
          <div className="kv-tag">Why Kvastram</div>
          <h2 className="kv-title">Handmade, edited, and ready to wear.</h2>
          <p className="kv-sub mt-4">
            The homepage is designed around real product media, short shopping paths,
            craft proof near buying moments, and fast routes to help.
          </p>
          <div className="craft-promise-actions">
            <Link href="/about/our-craft" className="home-link-button home-link-button--primary">
              Explore Craft
            </Link>
            <Link href="/products" className="home-link-button home-link-button--outline">
              Shop The Edit
            </Link>
          </div>
        </div>

        <div className="craft-promise-list" aria-label="Kvastram commerce promises">
          {promises.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="craft-promise-item">
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
