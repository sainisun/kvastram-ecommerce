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
    <section className="bg-surface-paper border-b border-border-subtle" aria-label="Odhvica shopping promises">
      <div className="ds-home-container">
        <div className="flex flex-nowrap overflow-x-auto gap-[20px] px-[16px] py-[12px] border-0 no-scrollbar md:grid md:grid-cols-4 md:gap-[1px] md:p-0 md:border-x md:border-border-subtle md:overflow-visible">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="flex-none flex items-center gap-[8px] p-0 border-0 min-h-auto md:grid md:grid-cols-[auto_1fr] md:gap-[12px] md:min-h-[92px] md:p-[18px] md:border-r md:border-border-subtle md:last:border-r-0">
                <Icon aria-hidden="true" size={19} strokeWidth={1.8} className="text-accent" />
                <div>
                  <strong className="block font-label text-[11px] md:text-body-sm font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)] leading-[var(--ds-leading-snug)] uppercase text-primary whitespace-nowrap md:whitespace-normal">{item.label}</strong>
                  <p className="hidden md:block md:mt-[4px] md:font-body md:text-body-xs md:leading-[var(--ds-leading-normal)] md:text-muted">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
