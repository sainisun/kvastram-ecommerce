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
      className="h-full min-h-[240px] bg-[var(--ds-text-primary)] flex flex-col justify-end p-5 relative cursor-pointer group"
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--ds-text-inverse)_0,var(--ds-text-inverse)_1px,transparent_1px,transparent_8px)] opacity-[0.06]" />
      <p className="font-body text-[9px] tracking-[0.16em] uppercase text-[var(--ds-text-inverse)]/45 mb-2">
        Featured this season
      </p>
      <h3 className="font-display text-[20px] italic font-normal text-[var(--ds-text-inverse)] leading-tight mb-3">
        {name}
      </h3>
      <span className="font-body text-[10px] tracking-[0.12em] uppercase text-[var(--ds-text-inverse)]/70 border-b border-[var(--ds-surface-paper)]/25 pb-0.5 inline-block group-hover:text-[var(--ds-text-inverse)] transition-colors">
        Shop the edit →
      </span>
    </Link>
  );
}
