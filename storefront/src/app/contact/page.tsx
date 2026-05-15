'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  MapPin,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { storefrontTrust } from '@/config/storefront-trust';

const reasonLabels: Record<string, string> = {
  payment: 'Payment Support',
  returns: 'Returns Support',
  tracking: 'Tracking Support',
  visit: 'Atelier / Visit Enquiry',
  'order-support': 'Order Support',
};

function buildReasonPrefill(reason: string | null, orderReference: string | null) {
  if (!reason && !orderReference) return '';

  const orderLine = orderReference
    ? `Order reference: #${orderReference}\n`
    : '';

  switch (reason) {
    case 'payment':
      return `${orderLine}I need help confirming whether my payment attempt went through.\n\nPayment method used:\nPayment time:\nWhat happened:\n`;
    case 'returns':
      return `${orderLine}I need help with a return or refund request.\n\nItem(s):\nReason:\nCurrent item condition:\n`;
    case 'tracking':
      return `${orderLine}I need help with order tracking or shipment visibility.\n\nWhat I can see right now:\nWhat I need help with:\n`;
    case 'visit':
      return `I want help with an atelier visit, stockist enquiry, or in-person buying request.\n\nCity:\nWhat I want to shop:\nPreferred timing:\n`;
    case 'order-support':
      return `${orderLine}I need general support for this order.\n\nIssue summary:\nWhat I need help with:\n`;
    default:
      return orderReference ? `I need help with order #${orderReference}.\n\n` : '';
  }
}

function ContactContent() {
  const searchParams = useSearchParams();
  const orderReference = searchParams.get('order');
  const emailPrefill = searchParams.get('email');
  const reason = searchParams.get('reason');
  const [formData, setFormData] = useState(() => ({
    firstName: '',
    lastName: '',
    email: emailPrefill || '',
    message: buildReasonPrefill(reason, orderReference),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2)
          return 'First name must be at least 2 characters';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2)
          return 'Last name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!emailRegex.test(value))
          return 'Please enter a valid email address';
        return '';
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10)
          return 'Message must be at least 10 characters';
        if (value.trim().length > 2000)
          return 'Message must be less than 2000 characters';
        return '';
      default:
        return '';
    }
  };

  // Handle blur - validate field when user leaves it
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // Check if form is valid
  const isFormValid =
    Object.values(errors).every((err) => err === '') &&
    Object.values(formData).every((val) => val.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          orderReference: orderReference || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(
          data.error || 'Failed to send message. Please try again.'
        );
      }
    } catch {
      setStatus('error');
      setErrorMessage(
        'Network error. Please check your connection and try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-6 md:grid-cols-2 md:gap-12 md:px-12 lg:gap-16 lg:px-20">
        {/* Info Text */}
        <div className="space-y-12">
          <div className="space-y-6">
            <span className="text-body-xs type-bold tracking-token-wider text-stone-500 uppercase">
              Get in Touch
            </span>
            <h1 className="text-display-xl font-serif text-stone-900 leading-token-tight">
              We&apos;d Love to <br /> Hear From You
            </h1>
            <p className="text-body-xl text-stone-600 type-light max-w-md">
              Whether you have a question about sizing, custom orders, or just
              want to tell us about your recent travels, our concierge team is
              here.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <Mail className="text-stone-400 mt-1" />
              <div>
                <h3 className="type-semibold text-stone-900">Email Us</h3>
                <p className="text-stone-500">{storefrontTrust.supportEmail}</p>
                <p className="text-stone-400 text-body-sm mt-1">
                  {storefrontTrust.supportHours}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="text-stone-400 mt-1" />
              <div>
                <h3 className="type-semibold text-stone-900">
                  Call or WhatsApp
                </h3>
                <p className="text-stone-500">{storefrontTrust.supportPhone}</p>
                <p className="text-stone-400 text-body-sm mt-1">
                  {storefrontTrust.supportHours}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="text-stone-400 mt-1" />
              <div>
                <h3 className="type-semibold text-stone-900">
                  Business Address
                </h3>
                <p className="text-stone-500">{storefrontTrust.addressLines[0]}</p>
                <p className="text-stone-500">{storefrontTrust.addressLines[1]}</p>
                <p className="text-stone-500">{storefrontTrust.addressLines[2]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-stone-50 p-8 md:p-12 rounded-none">
          {orderReference || reason ? (
            <div className="mb-6 border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
              {reason ? (
                <span>{reasonLabels[reason] || 'Support Request'}</span>
              ) : null}
              {reason && orderReference ? <span> for </span> : null}
              {orderReference ? (
                <span>
                  order <strong>#{orderReference}</strong>
                </span>
              ) : null}
            </div>
          ) : null}
          {status === 'success' ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-display-md font-serif text-stone-900 mb-2">
                Message Sent!
              </h3>
              <p className="text-stone-600 mb-6">
                {orderReference
                  ? `Your support request for order #${orderReference} is with our concierge team.`
                  : `Thank you for reaching out. We'll get back to you soon.`}
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="bg-stone-900 text-white py-3 px-8 type-bold uppercase tracking-token-wider text-body-xs hover:bg-stone-800 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  type="text"
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.firstName ? errors.firstName : undefined}
                />
                <Input
                  type="text"
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.lastName ? errors.lastName : undefined}
                />
              </div>

              <Input
                type="email"
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                error={touched.email ? errors.email : undefined}
              />

              <Textarea
                name="message"
                label="Message"
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                minLength={10}
                rows={4}
                error={touched.message ? errors.message : undefined}
              />

              <div className="border border-stone-200 bg-white px-4 py-4 text-body-sm text-stone-600">
                Need help with a payment or return instead of a general inquiry?
                Review the payment help and returns pages before sending a
                support message.
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href={storefrontTrust.policyRoutes.help}
                    className="inline-flex border border-stone-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900 transition-colors hover:bg-stone-50"
                  >
                    Help Center
                  </Link>
                  <Link
                    href={storefrontTrust.policyRoutes.paymentHelp}
                    className="inline-flex border border-stone-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900 transition-colors hover:bg-stone-50"
                  >
                    Payment Help
                  </Link>
                  <Link
                    href={storefrontTrust.policyRoutes.returns}
                    className="inline-flex border border-stone-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900 transition-colors hover:bg-stone-50"
                  >
                    Returns Help
                  </Link>
                </div>
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-body-sm">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !isFormValid}
                className="w-full bg-stone-900 text-white py-4 type-bold uppercase tracking-token-wider text-body-xs hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white py-12 md:py-16 lg:py-24" />}>
      <ContactContent />
    </Suspense>
  );
}
