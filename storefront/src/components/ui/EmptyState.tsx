import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  actions,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] px-6 py-12 text-center md:px-10 md:py-16',
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-[var(--ds-text-muted)]">
          {icon}
        </div>
      ) : null}
      {eyebrow ? (
        <p className="mb-3 font-body text-body-xs type-semibold uppercase tracking-token-wider text-[var(--ds-text-muted)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-display-sm type-semibold leading-token-tight text-[var(--ds-text-primary)]">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-xl font-body text-body-sm leading-token-relaxed text-[var(--ds-text-secondary)]">
          {description}
        </p>
      ) : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
