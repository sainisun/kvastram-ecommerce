import { HandHeart, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

const trustItems = [
  {
    icon: HandHeart,
    label: 'Handmade craft',
    copy: 'Small-batch pieces from Indian artisan workflows.',
  },
  {
    icon: Truck,
    label: 'Free India shipping',
    copy: 'Complimentary delivery on orders above Rs. 2,000.',
  },
  {
    icon: RotateCcw,
    label: 'Return support',
    copy: 'Clear exchange and return support after delivery.',
  },
  {
    icon: ShieldCheck,
    label: 'Secure checkout',
    copy: 'UPI, cards, wallets, and international PayPal.',
  },
];

export function HomeTrustBar() {
  return (
    <section className="home-trust-bar" aria-label="Kvastram shopping promises">
      <div className="kv-container">
        <div className="home-trust-grid">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="home-trust-item">
                <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
