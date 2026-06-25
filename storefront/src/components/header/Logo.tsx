import Link from 'next/link';

interface LogoProps {
  size?: 'desktop' | 'mobile';
  isTransparent?: boolean;
}

export function Logo({ size = 'desktop', isTransparent = false }: LogoProps) {
  const cls =
    size === 'mobile'
      ? 'font-display text-display-sm type-medium tracking-token-normal transition-colors duration-300'
      : 'font-display text-display-md type-medium tracking-token-normal transition-colors duration-300';

  const textColor = isTransparent ? 'text-[var(--ds-text-inverse)]' : 'text-[var(--ds-text-primary)]';

  return (
    <Link href="/" aria-label="Odhvica — Home" className={`${cls} ${textColor}`}>
      Kva<span className="text-[var(--ds-accent-primary)]">s</span>tram
    </Link>
  );
}
