'use client';

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className = '', id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {label}
            {rest.required && <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            {...rest}
            style={{
              width: '100%',
              height: '44px',
              padding: suffix ? '0 44px 0 12px' : '0 12px',
              fontFamily: 'var(--font-ui)',
              fontSize: '14px',
              color: 'var(--ink)',
              background: 'var(--paper)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--line)'}`,
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              transition: 'border-color 0.15s ease',
              opacity: rest.disabled ? 0.5 : 1,
              cursor: rest.disabled ? 'not-allowed' : 'text',
            }}
            onFocus={(e) => {
              if (!error) e.target.style.borderColor = 'var(--sienna)';
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? 'var(--danger)' : 'var(--line)';
              rest.onBlur?.(e);
            }}
            placeholder={rest.placeholder}
            className={`placeholder:text-[color:var(--muted)] sm:h-11 h-12 ${className}`}
          />
          {suffix && (
            <div className="absolute right-0 top-0 flex h-full items-center pr-3">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p
            role="alert"
            style={{
              fontSize: '11px',
              color: 'var(--danger)',
              marginTop: '2px',
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
