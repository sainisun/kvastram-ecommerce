'use client';

import { Button, Input } from '@/design-system';

interface CheckoutAuthStepProps {
  authEmail: string;
  authOtp: string;
  authStage: 'email' | 'otp';
  authLoading: boolean;
  authError: string;
  onEmailChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onChangeEmail: () => void;
}

export default function CheckoutAuthStep({
  authEmail,
  authOtp,
  authStage,
  authLoading,
  authError,
  onEmailChange,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
  onChangeEmail,
}: CheckoutAuthStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
          {authStage === 'email' ? 'Enter Email' : 'Verify OTP'}
        </h3>
        {authError && (
          <div className="bg-danger-bg text-error p-3 text-body-sm mb-4">{authError}</div>
        )}
        {authStage === 'email' ? (
          <div className="space-y-4">
            <p className="text-body-sm text-muted">Please enter your email to proceed with checkout.</p>
            <Input
              id="auth_email"
              type="email"
              name="auth_email"
              label="Email Address"
              required
              value={authEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              autoComplete="email"
            />
            <Button
              onClick={onSendOtp}
              disabled={authLoading}
              className="w-full mt-4"
              variant="primary"
            >
              Send OTP
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-body-sm text-muted">Enter the 6-digit code sent to {authEmail}</p>
            <Input
              id="auth_otp"
              type="text"
              name="auth_otp"
              label="6-Digit OTP"
              required
              value={authOtp}
              onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <Button
              onClick={onVerifyOtp}
              disabled={authLoading || authOtp.length !== 6}
              className="w-full mt-4"
              variant="primary"
            >
              Verify OTP
            </Button>
            <Button onClick={onChangeEmail} variant="inline" fullWidth type="button">
              Change Email
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
