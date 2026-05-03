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
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
            className="form-label-typography"
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
          className={`form-control-typography placeholder-muted ${className}`}
        />

        {error && (
          <p
            role="alert"
            style={{
              color: 'var(--danger)',
              marginTop: '2px',
            }}
            className="input-error-message"
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
