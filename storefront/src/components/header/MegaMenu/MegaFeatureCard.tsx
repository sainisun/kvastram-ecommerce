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
      <p className="font-label text-body-xs tracking-token-wide text-[var(--ds-text-inverse)]/45 mb-2">
        Featured this season
      </p>
      <h3 className="font-display text-display-sm italic type-regular text-[var(--ds-text-inverse)] leading-token-tight mb-3">
        {name}
      </h3>
      <span className="font-ui text-body-xs tracking-token-wide text-[var(--ds-text-inverse)]/70 border-b border-[var(--ds-surface-paper)]/25 pb-0.5 inline-block group-hover:text-[var(--ds-text-inverse)] transition-colors">
        Shop the edit →
      </span>
    </Link>
  );
}
