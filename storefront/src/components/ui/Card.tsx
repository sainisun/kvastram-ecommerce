import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const cardClasses =
  'rounded-[var(--radius-md)] border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)]';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        cardClasses,
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-[var(--ds-border-subtle)] p-5', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-[var(--ds-space-md)]', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t border-[var(--ds-border-subtle)] p-5', className)} {...props} />;
}
