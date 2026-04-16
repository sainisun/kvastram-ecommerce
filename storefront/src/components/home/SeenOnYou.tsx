const UGC_ITEMS = [
  { handle: 'ananya_x',        grayscale: true,  alt: 'Customer in ethnic wear street style' },
  { handle: 'the_ethnic_edit', grayscale: false, alt: 'Close up of ethnic textile in sunlight' },
  { handle: 'priya_kaur',      grayscale: true,  alt: 'Woman in flowing white outfit in garden' },
  { handle: 'minimal_maya',    grayscale: false, alt: 'Minimalist aesthetic indian wear' },
];

export function SeenOnYou() {
  return (
    <section className="py-16 bg-white px-6">
      <h3 className="text-center text-[11px] font-bold tracking-[0.2em] uppercase mb-10 text-black">
        SEEN ON YOU
      </h3>

      <div className="columns-2 gap-4 space-y-4">
        {UGC_ITEMS.map((item) => (
          <div key={item.handle} className="w-full break-inside-avoid">
            <div
              className={`w-full bg-zinc-200 ${item.grayscale ? 'grayscale' : ''}`}
              style={{ aspectRatio: item.handle === 'ananya_x' || item.handle === 'priya_kaur' ? '3/4' : '4/5' }}
              role="img"
              aria-label={item.alt}
            />
            <span className="text-[10px] text-zinc-500 mt-2 block">@{item.handle}</span>
          </div>
        ))}
      </div>

      <a
        href="https://www.instagram.com/kvastram/"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full mt-10 py-4 border border-black text-black text-[10px] font-bold tracking-[0.2em] uppercase text-center hover:bg-black hover:text-white transition-all"
      >
        TAG US @KVASTRAM
      </a>
    </section>
  );
}
