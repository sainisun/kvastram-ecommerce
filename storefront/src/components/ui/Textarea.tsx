'use client';

import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
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

        <textarea
          ref={ref}
          id={inputId}
          {...rest}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            fontFamily: 'var(--font-ui)',
            fontSize: '14px',
            color: 'var(--ink)',
            background: 'var(--paper)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--line)'}`,
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            resize: 'vertical',
            transition: 'border-color 0.15s ease',
            opacity: rest.disabled ? 0.5 : 1,
            cursor: rest.disabled ? 'not-allowed' : 'auto',
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = 'var(--sienna)';
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'var(--line)';
            rest.onBlur?.(e);
          }}
          className={`placeholder:text-[color:var(--muted)] ${className}`}
        />

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

Textarea.displayName = 'Textarea';
export default Textarea;
