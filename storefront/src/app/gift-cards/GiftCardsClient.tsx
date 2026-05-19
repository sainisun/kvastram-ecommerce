'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Gift, Loader2, Mail } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export function GiftCardsClient() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    amount: '2500',
    recipient: '',
    note: '',
  });
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const contactMessage = [
      'Gift card request',
      `Amount: Rs. ${form.amount}`,
      form.recipient ? `Recipient: ${form.recipient}` : null,
      form.note ? `Note: ${form.note}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          message: contactMessage,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Could not send the gift card request.');
      }

      setStatus('success');
      setMessage(data.message || 'Gift card request sent. Our team will follow up shortly.');
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        amount: '2500',
        recipient: '',
        note: '',
      });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Network error. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--ds-surface-parchment)] px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body-sm text-[var(--ds-text-muted)] transition-colors hover:text-[var(--ds-text-primary)]"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <div className="space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)]">
              <Gift size={22} />
            </div>
            <p className="text-body-xs type-semibold tracking-token-wider text-[var(--ds-text-muted)]">
              Gift Cards
            </p>
            <h1 className="font-display text-heading-xl text-[var(--ds-text-primary)]">
              Send a Kvastram gift request
            </h1>
            <p className="max-w-xl text-body-md leading-token-relaxed text-[var(--ds-text-secondary)]">
              Choose an amount, add recipient details, and our buyer care team will help you complete the gift.
            </p>
          </div>
          <div className="grid gap-3 text-body-sm text-[var(--ds-text-secondary)]">
            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] p-4">
              Choose an amount and send the request to the team.
            </div>
            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] p-4">
              The buyer care team confirms availability, payment, and delivery.
            </div>
            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] p-4">
              The recipient can redeem against eligible Kvastram pieces.
            </div>
          </div>
        </section>

        <Card className="p-5 shadow-sm md:p-7">
          {status === 'success' ? (
            <div className="mb-5 flex gap-3 border border-[var(--ds-success)] bg-[var(--ds-success-bg)] p-4 text-body-sm text-[var(--ds-success-text)]" role="status">
              <CheckCircle className="mt-0.5 shrink-0" size={18} />
              <p>{message}</p>
            </div>
          ) : null}
          {status === 'error' ? (
            <div className="mb-5 border border-[var(--ds-danger)] bg-[var(--ds-danger-bg)] p-4 text-body-sm text-[var(--ds-danger)]" role="alert">
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="firstName"
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                placeholder="First name"
                required
              />
              <Input
                name="lastName"
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                placeholder="Last name"
                required
              />
            </div>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              required
            />
            <label className="block">
              <span className="mb-2 block text-body-xs type-semibold tracking-token-wider text-[var(--ds-text-muted)]">
                Gift Amount
              </span>
              <select
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                className="h-12 w-full border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] px-3 text-body-sm text-[var(--ds-text-primary)] outline-none focus:border-[var(--ds-accent-primary)]"
              >
                <option value="1000">Rs. 1,000</option>
                <option value="2500">Rs. 2,500</option>
                <option value="5000">Rs. 5,000</option>
                <option value="10000">Rs. 10,000</option>
              </select>
            </label>
            <Input
              name="recipient"
              value={form.recipient}
              onChange={(event) => setForm((current) => ({ ...current, recipient: event.target.value }))}
              placeholder="Recipient name (optional)"
            />
            <Textarea
              name="note"
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="Occasion or short note (optional)"
              maxLength={500}
            />
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              disabled={status === 'loading'}
              leadingIcon={status === 'loading' ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
            >
              {status === 'loading' ? 'Sending Request' : 'Request Gift Card'}
            </Button>
            <ButtonLink href="/products" variant="outline" size="lg" fullWidth>
              Shop Collection
            </ButtonLink>
          </form>
        </Card>
      </div>
    </div>
  );
}
