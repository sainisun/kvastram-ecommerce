import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'pdp' | 'success' | 'compact' | 'inline' | 'categoryOverlay' | 'product-card';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

interface ButtonLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-[var(--ds-border-dark)] bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)] hover:bg-[var(--ds-border-strong)] hover:border-[var(--ds-border-strong)]',
  secondary:
    'bg-[var(--ds-surface-soft)] text-[var(--ds-text-primary)] border-[var(--ds-border-subtle)] hover:bg-[var(--ds-border-subtle)] hover:border-[var(--ds-border-strong)]',
  outline:
    'border-[var(--ds-border-dark)] bg-[var(--ds-surface-page)] text-[var(--ds-text-primary)] hover:bg-[var(--ds-text-primary)] hover:text-[var(--ds-text-inverse)]',
  ghost:
    'border-transparent bg-transparent text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-soft)]',
  danger:
    'border-[var(--ds-danger)] bg-[var(--ds-danger)] text-[var(--ds-text-inverse)] hover:brightness-95',
  accent:
    'bg-[var(--ds-accent-gold)] text-[var(--ds-text-primary)] border-[var(--ds-accent-gold)] hover:bg-[var(--ds-accent-hover)] hover:border-[var(--ds-accent-hover)]',
  pdp:
    'bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)] border-[var(--ds-accent-primary)] hover:bg-[var(--ds-accent-hover)] hover:border-[var(--ds-accent-hover)] w-full',
  success:
    'bg-[var(--ds-success)] text-[var(--ds-text-inverse)] border-[var(--ds-success)] hover:bg-[var(--ds-success-dark)] hover:border-[var(--ds-success-dark)]',
  compact:
    'bg-[var(--ds-surface-soft)] text-[var(--ds-text-primary)] border-[var(--ds-border-subtle)] hover:bg-[var(--ds-border-subtle)] hover:border-[var(--ds-border-subtle)] text-body-xs py-1 px-3',
  inline:
    'bg-transparent text-[var(--ds-accent-primary)] border-transparent hover:text-[var(--ds-accent-hover)] underline underline-offset-2 p-0 h-auto',
  categoryOverlay:
    'bg-[rgba(var(--ds-white-rgb),0.15)] text-[var(--ds-text-inverse)] border-[rgba(var(--ds-white-rgb),0.3)] hover:bg-[rgba(var(--ds-white-rgb),0.25)] backdrop-blur-sm',
  'product-card':
    'bg-[var(--ds-surface-page)] text-[var(--ds-text-primary)] border-[var(--ds-border-subtle)] hover:bg-[var(--ds-surface-soft)] hover:border-[var(--ds-border-subtle)] text-body-xs',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-body-xs',
  md: 'min-h-11 px-5 text-body-xs',
  lg: 'min-h-12 px-7 text-body-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leadingIcon,
      trailingIcon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-ui type-semibold tracking-token-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
);

Button.displayName = 'Button';

export function ButtonLink({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-ui type-semibold tracking-token-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] aria-disabled:pointer-events-none aria-disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}

export function ButtonAnchor({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonAnchorProps) {
  return (
    <a
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-ui type-semibold tracking-token-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] aria-disabled:pointer-events-none aria-disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </a>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: Extract<ButtonVariant, 'outline' | 'ghost' | 'secondary' | 'primary'>;
}

const iconSizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', variant = 'ghost', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        iconSizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

IconButton.displayName = 'IconButton';

export const UnstyledButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));

UnstyledButton.displayName = 'UnstyledButton';
