import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  width?: 'default' | 'wide' | 'narrow';
}

const widthClasses = {
  default: 'max-w-[1440px]',
  wide: 'max-w-[1600px]',
  narrow: 'max-w-[var(--ds-narrow-width)]',
};

export function Section({ className, width = 'default', children, ...props }: SectionProps) {
  return (
    <section className={cn('py-12 md:py-16 lg:py-24', className)} {...props}>
      <div className={cn('mx-auto px-6 md:px-12 lg:px-20', widthClasses[width])}>
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: ReactNode;
  heading: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({
  className,
  eyebrow,
  heading,
  description,
  action,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between',
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-3 font-body text-body-xs type-semibold uppercase tracking-token-wider text-[var(--ds-text-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="max-w-heading font-display text-display-md type-semibold leading-token-tight text-[var(--ds-text-primary)]">
          {heading}
        </h2>
        {description ? (
          <p className="mt-4 max-w-prose font-body text-body-lg leading-token-relaxed text-[var(--ds-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
