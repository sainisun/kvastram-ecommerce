'use client';

import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface NewsletterFormProps {
  minimal?: boolean;
}

export default function NewsletterForm({ minimal = false }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe');
      }
    } catch (_error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 ${minimal ? 'text-green-600' : 'text-green-400'}`} role="status" aria-live="polite">
        <CheckCircle size={minimal ? 16 : 20} aria-hidden="true" />
        <span className={minimal ? 'text-sm' : ''}>{message}</span>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={`flex ${minimal ? 'flex-col gap-2' : 'gap-0'}`} aria-label="Newsletter subscription">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          disabled={status === 'loading'}
          className={`flex-1 focus:outline-none transition-colors disabled:opacity-50 ${
            minimal 
              ? 'bg-stone-800 border border-stone-700 px-4 py-2 text-white placeholder-stone-500 text-sm rounded focus:border-stone-500' 
              : 'bg-white/5 border border-white/10 border-r-0 px-6 py-4 text-white placeholder-stone-500 focus:bg-white/10'
          }`}
          aria-label="Email address"
          aria-required="true"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
            minimal 
              ? 'bg-white text-stone-900 px-4 py-2 rounded hover:bg-stone-200' 
              : 'bg-white text-stone-900 px-8 py-4 hover:bg-stone-200'
          }`}
          aria-label={status === 'loading' ? 'Subscribing to newsletter' : 'Subscribe to newsletter'}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              {minimal ? '' : 'Subscribing...'}
            </>
          ) : (
            'Subscribe'
          )}
        </button>
      </form>
      {status === 'error' && (
        <p className={`text-sm mt-2 text-red-400`} role="alert">{message}</p>
      )}
    </>
  );
}
