const FABRICS = [
  {
    name: 'Handloom Silk',
    description:
      'Woven by artisans in Banaras using ancestral techniques passed through generations.',
    bg: 'from-[#6c5447] to-[#2f241d]',
  },
  {
    name: 'Chanderi Cotton',
    description:
      'Lightweight and breathable, hand-woven in Madhya Pradesh with fine thread counts.',
    bg: 'from-[#8b7b67] to-[#4e4438]',
  },
  {
    name: 'Pashmina Wool',
    description:
      "Sourced from the high-altitude pastures of Kashmir - nature's finest insulator.",
    bg: 'from-[#4b5552] to-[#222927]',
  },
  {
    name: 'Organza',
    description:
      'Crisp, sheer fabric with a luminous quality that drapes beautifully for occasions.',
    bg: 'from-[#bca995] to-[#6d5a4a]',
  },
];

export function FabricsSection() {
  return (
    <section className="bg-[#efe7dd] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3 text-center sm:mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
            Our Fabrics
          </p>
          <h3 className="font-heading text-[32px] font-semibold leading-[0.98] text-stone-950 sm:text-[40px] lg:text-[48px]">
            Material stories behind the silhouette
          </h3>
          <p className="mx-auto max-w-2xl text-[15px] font-[300] leading-7 text-stone-600">
            The final homepage block stays dedicated to fabric storytelling,
            now presented in a richer visual format.
          </p>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-4">
          {FABRICS.map((fabric) => (
            <div
              key={fabric.name}
              className="relative min-w-[260px] flex-shrink-0 snap-start overflow-hidden rounded-[30px] sm:min-w-[320px] md:min-w-0"
            >
              <div className={`aspect-[4/5] w-full bg-gradient-to-br ${fabric.bg}`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_50%)]" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Fabric Story
                </p>
                <h4 className="mt-3 font-heading text-3xl text-white">
                  {fabric.name}
                </h4>
                <p className="mt-3 text-[13px] leading-6 text-stone-200">
                  {fabric.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
