import Link from 'next/link';

interface LogoProps {
  size?: 'desktop' | 'mobile';
}

export function Logo({ size = 'desktop' }: LogoProps) {
  const cls =
    size === 'mobile'
      ? 'font-display text-display-sm type-medium tracking-token-normal text-[var(--ds-text-primary)]'
      : 'font-display text-display-md type-medium tracking-token-normal text-[var(--ds-text-primary)]';

  return (
    <Link href="/" aria-label="Kvastram — Home" className={cls}>
      Kva<span className="text-[var(--ds-accent-primary)]">s</span>tram
    </Link>
  );
}
