import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Tv, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth, DEFAULT_ACCOUNTS } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginPageProps {
  onOpenDisplay?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenDisplay }) => {
  const { login, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetSentSuccess, setResetSentSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both Email and Password.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelectRole = (role: UserRole) => {
    const acc = DEFAULT_ACCOUNTS[role];
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMessage(null);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmailInput.trim()) return;
    try {
      await resetPassword(resetEmailInput);
      setResetSentSuccess(true);
      setTimeout(() => {
        setResetSentSuccess(false);
        setShowForgotModal(false);
      }, 2500);
    } catch (err) {
      // Ignored
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between antialiased selection:bg-amber-500 selection:text-black">
      {/* Top Bar with Brand & Direct Display Link */}
      <header className="border-b border-slate-900 bg-slate-950/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/brl-logo.png" 
            alt="Bharat Robotics League Logo" 
            className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]" 
          />
          <div>
            <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              Bharat Robotics League
            </h1>
            <p className="text-xs text-amber-400 font-mono">BRL 2026 • 29 SEPTEMBER 2026</p>
          </div>
        </div>

        {onOpenDisplay && (
          <button
            onClick={onOpenDisplay}
            type="button"
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition shadow-sm"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Open Arena Display</span>
          </button>
        )}
      </header>

      {/* Center Login Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-3 text-amber-400">
              <Shield className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                BRL 2026
              </span>
              <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">
                Secure Event Control
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Sign In to Arena Control
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Authorized Tournament Officials & Evaluators Only
            </p>
          </div>

          {/* Quick Role Fill Pills */}
          <div className="mb-5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Role Credentials
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSelectRole('ADMIN')}
                className="px-2 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition text-center"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelectRole('CONTROLLER')}
                className="px-2 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition text-center"
              >
                CONTROLLER
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelectRole('EVALUATOR')}
                className="px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition text-center"
              >
                EVALUATOR
              </button>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email / User ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@brl2026.org"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailInput(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wider uppercase transition shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Bharat Robotics League 2026 Scoring System • Zero-Trust Role Protection
            </p>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-400 mb-2">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Reset Account Password</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered official email to receive a password reset link.
            </p>

            {resetSentSuccess ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Password reset instructions dispatched.</span>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-3">
                <input
                  type="email"
                  value={resetEmailInput}
                  onChange={(e) => setResetEmailInput(e.target.value)}
                  placeholder="official@brl2026.org"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100"
                />
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-6 text-center text-xs text-slate-500">
        Bharat Robotics League • 29 September 2026 • Official Live Scoring System
      </footer>
    </div>
  );
};
