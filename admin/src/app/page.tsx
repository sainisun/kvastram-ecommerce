'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Shield, Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useNotification } from '@/context/notification-context';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const { login } = useAuth(); // Destructure login from context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.login(
        email,
        password,
        show2FA ? twoFactorCode : undefined
      );

      // Use context login to update state globally
      login(result);

      showNotification('success', 'Welcome back!');
      // router.push handled by context login
    } catch (err: any) {
      // Check for 2FA requirement
      // err.response comes from our customized api wrapper
      if (err.response && err.response.require2fa) {
        setShow2FA(true);
        showNotification('info', 'Please enter your 2FA code');
        // Don't show error, just switch mode
      } else {
        // If 2FA code was invalid
        if (show2FA && err.message === 'Invalid 2FA Code') {
          showNotification('error', 'Invalid Authentication Code');
        } else {
          showNotification('error', err.message || 'Login failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl relative overflow-hidden">
        {/* Background blobs for aesthetics */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl"></div>

        <div className="text-center relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Kvastram Admin</h1>
          <p className="text-gray-300">
            {show2FA ? 'Two-Factor Authentication' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {!show2FA ? (
            <>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2"
                >
                  <Mail size={16} /> Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="admin@kvastram.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2"
                >
                  <Lock size={16} /> Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-blue-500/20 text-blue-200 p-3 rounded-lg text-sm mb-4 border border-blue-500/30">
                Enter the 6-digit code from your authenticator app to continue.
              </div>
              <div>
                <label
                  htmlFor="2fa"
                  className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2"
                >
                  <Shield size={16} /> Authentication Code
                </label>
                <input
                  id="2fa"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) =>
                    setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))
                  }
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="000 000"
                  autoFocus
                />
              </div>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShow2FA(false);
                    setTwoFactorCode('');
                  }}
                  className="text-sm text-gray-400 hover:text-white underline"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50"
          >
            {loading ? 'Verifying...' : show2FA ? 'Verify Code' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
