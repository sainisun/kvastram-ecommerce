import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'danger' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    'border-[var(--ds-border-subtle)] bg-[var(--ds-surface-soft)] text-[var(--ds-text-secondary)]',
  accent:
    'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-soft)] text-[var(--ds-accent-hover)]',
  success:
    'border-[var(--ds-success)] bg-[var(--ds-success-bg)] text-[var(--ds-success-text)]',
  danger:
    'border-[var(--ds-danger)] bg-[var(--ds-surface-paper)] text-[var(--ds-danger)]',
  outline:
    'border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)]',
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-2.5 py-1 font-body text-body-xs type-semibold uppercase tracking-token-wide leading-none',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
