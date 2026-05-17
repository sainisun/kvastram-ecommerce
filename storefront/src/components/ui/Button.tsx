import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)] hover:border-[var(--ds-accent-hover)] hover:bg-[var(--ds-accent-hover)]',
  secondary:
    'border-[var(--ds-text-primary)] bg-[var(--ds-text-primary)] text-[var(--ds-text-inverse)] hover:border-[var(--ds-accent-hover)] hover:bg-[var(--ds-accent-hover)]',
  outline:
    'border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)] hover:border-[var(--ds-accent-primary)] hover:text-[var(--ds-accent-primary)]',
  ghost:
    'border-transparent bg-transparent text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-soft)]',
  danger:
    'border-[var(--ds-danger)] bg-[var(--ds-danger)] text-[var(--ds-text-inverse)] hover:brightness-95',
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
        'inline-flex items-center justify-center gap-2 border font-body type-semibold uppercase tracking-token-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50',
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
