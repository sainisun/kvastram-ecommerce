const TRUST_ITEMS = [
  { icon: '✦', label: 'Handmade in India', sub: 'Every stitch by hand' },
  { icon: '✦', label: 'Ships Worldwide', sub: 'USA · UK · EU · AU' },
  { icon: '✦', label: 'Ethically Made', sub: 'Fair wages, always' },
  { icon: '✦', label: '500+ Happy Customers', sub: 'Verified reviews' },
  { icon: '✦', label: 'Secure Checkout', sub: 'Visa · PayPal · Apple Pay' },
];

export function AsSeenOn() {
  return (
    <section className="border-y border-stone-200 bg-white px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12 lg:gap-x-16">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-900">
                {item.label}
              </span>
              <span className="mt-0.5 text-[10px] tracking-[0.1em] text-stone-400">
                {item.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
