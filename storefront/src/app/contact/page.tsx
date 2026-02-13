'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Last name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10) return 'Message must be at least 10 characters';
        if (value.trim().length > 2000) return 'Message must be less than 2000 characters';
        return '';
      default:
        return '';
    }
  };

  // Handle blur - validate field when user leaves it
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Check if form is valid
  const isFormValid = Object.values(errors).every(err => err === '') &&
    Object.values(formData).every(val => val.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">

        {/* Info Text */}
        <div className="space-y-12">
          <div className="space-y-6">
            <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">Get in Touch</span>
            <h1 className="text-5xl font-serif text-stone-900 leading-tight">
              We&apos;d Love to <br /> Hear From You
            </h1>
            <p className="text-lg text-stone-600 font-light max-w-md">
              Whether you have a question about sizing, custom orders, or just want to tell us
              about your recent travels, our concierge team is here.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <Mail className="text-stone-400 mt-1" />
              <div>
                <h3 className="font-semibold text-stone-900">Email Us</h3>
                <p className="text-stone-500">concierge@kvastram.com</p>
                <p className="text-stone-400 text-sm mt-1">Replies within 2 hours.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="text-stone-400 mt-1" />
              <div>
                <h3 className="font-semibold text-stone-900">Call or WhatsApp</h3>
                <p className="text-stone-500">+91 98765 43210</p>
                <p className="text-stone-400 text-sm mt-1">Mon-Fri, 9am - 6pm IST</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="text-stone-400 mt-1" />
              <div>
                <h3 className="font-semibold text-stone-900">Atelier</h3>
                <p className="text-stone-500">
                  12, Heritage Lane, Hauz Khas Village<br />
                  New Delhi, 110016, India
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-stone-50 p-8 md:p-12 rounded-none">
          {status === 'success' ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-serif text-stone-900 mb-2">Message Sent!</h3>
              <p className="text-stone-600 mb-6">Thank you for reaching out. We&apos;ll get back to you soon.</p>
              <button
                onClick={() => setStatus('idle')}
                className="bg-stone-900 text-white py-3 px-8 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-stone-500">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-invalid={errors.firstName ? 'true' : 'false'}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    className={`w-full bg-white border-b p-3 focus:outline-none transition-colors ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'}`}
                  />
                  {errors.firstName && touched.firstName && (
                    <p id="firstName-error" className="text-red-500 text-xs mt-1" role="alert">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-stone-500">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-invalid={errors.lastName ? 'true' : 'false'}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    className={`w-full bg-white border-b p-3 focus:outline-none transition-colors ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'}`}
                  />
                  {errors.lastName && touched.lastName && (
                    <p id="lastName-error" className="text-red-500 text-xs mt-1" role="alert">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-stone-500">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full bg-white border-b p-3 focus:outline-none transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'}`}
                />
                {errors.email && touched.email && (
                  <p id="email-error" className="text-red-500 text-xs mt-1" role="alert">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-stone-500">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  minLength={10}
                  rows={4}
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  className={`w-full bg-white border-b p-3 focus:outline-none transition-colors resize-none ${errors.message ? 'border-red-500 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'}`}
                ></textarea>
                {errors.message && touched.message && (
                  <p id="message-error" className="text-red-500 text-xs mt-1" role="alert">{errors.message}</p>
                )}
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !isFormValid}
                className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
