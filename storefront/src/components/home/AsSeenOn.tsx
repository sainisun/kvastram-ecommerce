const PRESS_LOGOS = ['Vogue', 'Elle', "Harper's", 'Cosmopolitan', 'Grazia', 'Femina'];

export function AsSeenOn() {
  return (
    <section className="bg-[#f8f1eb] px-4 py-16 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 text-center text-[11px] uppercase tracking-[0.25em] text-stone-500">
          As Seen In
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
          {PRESS_LOGOS.map((logo) => (
            <div
              key={logo}
              className="font-heading text-[24px] font-medium text-stone-500 opacity-70 transition-opacity hover:opacity-100"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
