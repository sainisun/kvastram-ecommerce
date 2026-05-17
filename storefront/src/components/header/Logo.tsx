import Link from 'next/link';

interface LogoProps {
  size?: 'desktop' | 'mobile';
}

export function Logo({ size = 'desktop' }: LogoProps) {
  const cls =
    size === 'mobile'
      ? 'font-display text-[19px] font-medium tracking-[0.18em] uppercase text-[var(--ds-text-primary)]'
      : 'font-display text-[26px] font-medium tracking-[0.18em] uppercase text-[var(--ds-text-primary)]';

  return (
    <Link href="/" aria-label="Kvastram — Home" className={cls}>
      Kva<span className="text-[var(--ds-accent-primary)]">s</span>tram
    </Link>
  );
}
