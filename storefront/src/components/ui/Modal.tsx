'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  rootClassName?: string;
  bodyClassName?: string;
  showHeader?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  rootClassName,
  bodyClassName,
  showHeader = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={cn('fixed inset-0 z-[100] flex items-center justify-center p-4', rootClassName)}>
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(var(--ds-ink-rgb),0.48)]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)] shadow-[var(--ds-shadow)]',
          className
        )}
      >
        {showHeader ? (
          <div className="flex items-center justify-between gap-4 border-b border-[var(--ds-border-subtle)] p-5">
            {title ? (
              <h2 className="font-display text-display-sm type-semibold leading-token-tight">
                {title}
              </h2>
            ) : <span />}
            <IconButton aria-label="Close modal" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </div>
        ) : null}
        <div className={cn('p-5', bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}
