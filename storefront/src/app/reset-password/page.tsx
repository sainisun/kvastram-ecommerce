'use client';

import { useState, Suspense, useEffect, useMemo, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Eye, EyeOff, Check, X, CheckCircle } from 'lucide-react';
import Input from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBanner } from '@/components/ui/StatusBanner';

function usePasswordValidation(password: string) {
  return useMemo(
    () => ({
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password]
  );
}

function SuccessView() {
  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-[var(--ds-surface-paper)] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <EmptyState
        icon={<CheckCircle size={48} />}
        title="Password Reset Successfully"
        description="Your password has been reset. You can now log in with your new password."
        actions={
        <Link
          href="/login"
          className="inline-block bg-[var(--ds-text-primary)] text-[var(--ds-text-inverse)] px-8 py-3 type-bold uppercase tracking-token-wider text-body-xs hover:bg-[var(--ds-text-secondary)] transition-colors"
        >
          Go to Login
        </Link>
        }
        className="max-w-md"
      />
    </div>
  );
}

function PasswordRequirement({
  label,
  isValid,
}: {
  readonly label: string;
  readonly isValid: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 ${isValid ? 'text-[var(--ds-success-text)]' : 'text-[var(--ds-text-muted)]'}`}
    >
      {isValid ? <Check size={12} /> : <X size={12} />}
      {label}
    </div>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValid = usePasswordValidation(password);

  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
    }
  }, [token, router]);

  const isPasswordValid = Object.values(passwordValid).every(Boolean);
  const passwordsMatch = password === confirmPassword && password !== '';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/store/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) return <SuccessView />;

  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-[var(--ds-surface-paper)] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="inline-flex items-center text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Link>
          <h1 className="text-display-lg font-display text-[var(--ds-text-primary)]">Reset Password</h1>
          <p className="mt-2 text-[var(--ds-text-muted)] type-light">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <StatusBanner tone="danger">{error}</StatusBanner>
          )}

          <div className="space-y-2">
            <Input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              required
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              suffix={
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8 w-8 border-0"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              }
            />

            {/* Password requirements */}
            <div className="space-y-1 mt-2">
              <p className="text-body-xs text-[var(--ds-text-muted)] mb-2">
                Password must contain:
              </p>
              <div className="grid grid-cols-2 gap-1 text-body-xs">
                <PasswordRequirement
                  label="At least 12 characters"
                  isValid={passwordValid.length}
                />
                <PasswordRequirement
                  label="One uppercase letter"
                  isValid={passwordValid.uppercase}
                />
                <PasswordRequirement
                  label="One lowercase letter"
                  isValid={passwordValid.lowercase}
                />
                <PasswordRequirement
                  label="One number"
                  isValid={passwordValid.number}
                />
                <PasswordRequirement
                  label="One special character"
                  isValid={passwordValid.special}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              id="reset-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
              suffix={
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="h-8 w-8 border-0"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              }
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !isPasswordValid || !passwordsMatch}
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={loading ? <Loader2 className="animate-spin" size={16} /> : null}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
