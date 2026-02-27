'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login';

// Facebook OAuth Wrapper Component
function FacebookOAuthWrapper({ redirect }: { redirect: string }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  const handleFacebookCallback = async (response: Record<string, unknown>) => {
    try {
      if (!response?.accessToken) {
        setError('Facebook authentication failed. Please try again.');
        return;
      }

      const accessToken = response.accessToken as string;
      const email = (response.email as string) || '';
      const name = (response.name as string) || '';
      const picture = response.picture as
        | { data?: { url?: string } }
        | undefined;

      // Call backend API
      const apiResponse = await api.socialLogin('facebook', {
        access_token: accessToken,
        email: email,
        name: name,
        avatar: picture?.data?.url,
      });

      if (apiResponse.customer) {
        setUser(apiResponse.customer);
        router.push(redirect);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Facebook login error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Facebook login failed. Please try again.';
      setError(errorMessage);
    }
  };

  if (!FB_APP_ID) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        Facebook login not configured. Please use email login.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}
      <FacebookLogin
        appId={FB_APP_ID}
        autoLoad={false}
        fields="name,email,picture"
        callback={handleFacebookCallback}
        cssClass="w-full py-3 border border-stone-200 bg-white text-stone-700 font-medium flex items-center justify-center gap-3 hover:bg-stone-50 transition-colors cursor-pointer"
        icon={
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        }
        textButton="Continue with Facebook"
      />
    </div>
  );
}

// Google OAuth Wrapper Component
function GoogleOAuthWrapper({ redirect }: { redirect: string }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      const { credential } = credentialResponse;
      if (!credential) {
        setError('Google authentication failed. Please try again.');
        return;
      }

      // Decode JWT to get user info
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      const userInfo = JSON.parse(jsonPayload);

      // Call backend API
      const response = await api.socialLogin('google', {
        id_token: credential,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
      });

      if (response.customer) {
        setUser(response.customer);
        router.push(redirect);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Google login error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Google login failed. Please try again.';
      setError(errorMessage);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again or use email login.');
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        Google login not configured. Please use email login.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            width="100%"
            text="continue_with"
          />
        </div>
      </GoogleOAuthProvider>
    </div>
  );
}

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      await login(formData);
      router.push(redirect);
    } catch (err: unknown) {
      console.error('Login error:', err);

      let errorMessage = 'Login failed. Please try again.';
      if (err && typeof err === 'object') {
        const errorObj = err as Record<string, unknown>;
        errorMessage =
          (typeof errorObj.error === 'string' && errorObj.error) ||
          (err instanceof Error && err.message) ||
          (typeof errorObj.message === 'string' && errorObj.message) ||
          'Login failed. Please try again.';
      }

      setError(errorMessage);

      // Show resend verification option
      if (errorMessage.includes('verify your email')) {
        setShowResend(true);
      }

      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setResending(true);
    setError('');

    try {
      const { api } = await import('@/lib/api');
      await api.resendVerification(formData.email);
      setResendSuccess(true);
      setShowResend(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to resend verification email';
      setError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-stone-900">Welcome Back</h1>
          <p className="mt-2 text-stone-500 font-light">
            Sign in to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="text-sm">
                Verification email sent! Please check your inbox.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-stone-500">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full border-b border-stone-200 py-2 focus:outline-none focus:border-stone-900 transition-colors"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-stone-500">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full border-b border-stone-200 py-2 pr-10 focus:outline-none focus:border-stone-900 transition-colors"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            disabled={loading}
            className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {showResend && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          )}

          {/* Social Login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>

            {/* Only show divider and OAuth section if at least one provider is configured */}
            {(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) && (
              <>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-stone-400">
                    or continue with
                  </span>
                </div>

                <div className="space-y-3">
                  <GoogleOAuthWrapper redirect={redirect} />
                  <FacebookOAuthWrapper redirect={redirect} />
                </div>
              </>
            )}
          </div>
          </form>

        <div className="text-center text-sm text-stone-500">
          Don&apos;t have an account?{' '}
          <Link
            href={`/register?redirect=${redirect}`}
            className="text-stone-900 font-medium underline"
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
