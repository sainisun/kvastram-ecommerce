import Link from 'next/link';

interface MegaFeatureCardProps {
  name: string;
  handle: string;
  onClick?: () => void;
}

export function MegaFeatureCard({ name, handle, onClick }: MegaFeatureCardProps) {
  return (
    <Link
      href={`/collections/${handle}`}
      onClick={onClick}
      className="h-full min-h-[240px] bg-[#1a1714] flex flex-col justify-end p-5 relative cursor-pointer group"
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 8px)' }}
      />
      <p className="font-[family-name:var(--font-ui)] text-[9px] tracking-[0.16em] uppercase text-white/45 mb-2">
        Featured this season
      </p>
      <h3 className="font-[family-name:var(--font-display)] text-[20px] italic font-normal text-white leading-tight mb-3">
        {name}
      </h3>
      <span className="font-[family-name:var(--font-ui)] text-[10px] tracking-[0.12em] uppercase text-white/70 border-b border-white/25 pb-0.5 inline-block group-hover:text-white transition-colors">
        Shop the edit →
      </span>
    </Link>
  );
}
