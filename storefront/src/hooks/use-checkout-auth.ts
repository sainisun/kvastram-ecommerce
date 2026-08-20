'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Customer } from '@/types';

interface UseCheckoutAuthOptions {
  customer: Customer | null;
  onCustomerVerified: (customer: Customer) => void;
}

export function useCheckoutAuth({
  customer,
  onCustomerVerified,
}: UseCheckoutAuthOptions) {
  const [authEmail, setAuthEmail] = useState(customer?.email || '');
  const [authOtp, setAuthOtp] = useState('');
  const [authStage, setAuthStage] = useState<'email' | 'otp'>('email');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (customer?.email) setAuthEmail(customer.email);
  }, [customer?.email]);

  const sendOtp = async () => {
    if (!authEmail) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      await api.sendCheckoutOtp(authEmail);
      setAuthStage('otp');
    } catch (error: unknown) {
      const requestError = error as Error;
      setAuthError(requestError.message || 'Failed to send OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (authOtp.length !== 6) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await api.verifyCheckoutOtp(authEmail, authOtp);
      onCustomerVerified(response.customer);
    } catch (error: unknown) {
      const verificationError = error as Error;
      setAuthError(verificationError.message || 'Invalid OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    authEmail,
    authOtp,
    authStage,
    authLoading,
    authError,
    setAuthEmail,
    setAuthOtp,
    sendOtp,
    verifyOtp,
    changeEmail: () => setAuthStage('email'),
  };
}
