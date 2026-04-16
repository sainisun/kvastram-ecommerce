const FABRICS = [
  {
    name: 'Handloom Silk',
    description: 'Woven by artisans in Banaras using ancestral techniques passed through generations.',
    bg: 'bg-zinc-700',
  },
  {
    name: 'Chanderi Cotton',
    description: 'Lightweight and breathable, hand-woven in Madhya Pradesh with fine thread counts.',
    bg: 'bg-zinc-600',
  },
  {
    name: 'Pashmina Wool',
    description: 'Sourced from the high-altitude pastures of Kashmir — nature\'s finest insulator.',
    bg: 'bg-zinc-800',
  },
  {
    name: 'Organza',
    description: 'Crisp, sheer fabric with a luminous quality that drapes beautifully for occasions.',
    bg: 'bg-zinc-500',
  },
];

export function FabricsSection() {
  return (
    <section className="py-16 bg-zinc-200 px-6">
      <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase mb-10 text-black">
        OUR FABRICS
      </h3>
      <div className="overflow-x-auto no-scrollbar flex gap-6">
        {FABRICS.map((fabric) => (
          <div key={fabric.name} className="min-w-[240px] relative flex-shrink-0">
            <div className={`w-full aspect-[4/5] ${fabric.bg}`} />
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">
              <h4 className="font-heading text-2xl text-white mb-2">{fabric.name}</h4>
              <p className="text-[10px] text-neutral-300 leading-normal">{fabric.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
