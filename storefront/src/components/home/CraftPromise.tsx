import Link from 'next/link';
import { Globe2, Hand, MessageCircle, ShieldCheck } from 'lucide-react';

const promises = [
  {
    icon: Hand,
    title: 'Jaipur craft, edited for daily wear',
    copy: 'Small-batch kantha, block print, and quilted pieces selected for texture, finish, and repeat wear.',
  },
  {
    icon: ShieldCheck,
    title: 'Storefront-ready quality gate',
    copy: 'Products without sellable price, image, or publish-ready naming stay out of the customer journey.',
  },
  {
    icon: Globe2,
    title: 'India-first, global-friendly',
    copy: 'Clear shipping, payment, and support paths for Indian and international shoppers.',
  },
  {
    icon: MessageCircle,
    title: 'Assisted commerce when it matters',
    copy: 'WhatsApp and studio support stay close for custom questions, sizing, gifts, and bulk orders.',
  },
];

export function CraftPromise() {
  return (
    <section className="kv-section craft-promise-section">
      <div className="kv-container craft-promise-grid">
        <div className="craft-promise-copy">
          <div className="kv-tag">Craft-led commerce</div>
          <h2 className="kv-title">A handmade store should feel edited, not uploaded.</h2>
          <p className="kv-sub mt-4">
            Kvastram is being shaped around fewer, stronger decisions: real product media,
            short display names, craft proof near buying moments, and fast routes to help.
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
