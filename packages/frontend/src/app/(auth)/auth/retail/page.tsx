'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wallet, ArrowLeft, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { authApi } from '@/lib/api/auth';
import { useConnect, useWallets } from '@partylayer/react';
import type { WalletId } from '@partylayer/sdk';

type Mode = 'login' | 'register';

interface PasswordCheck {
  length: boolean;
  uppercase: boolean;
  number: boolean;
}

function checkPassword(pw: string): PasswordCheck {
  return {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
  };
}

function PasswordStrengthBar({ checks }: { checks: PasswordCheck }) {
  const segments = [checks.length, checks.uppercase, checks.number];
  const filled = segments.filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {segments.map((met, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-500 ease-out"
            style={{
              background: met
                ? filled === 3
                  ? 'var(--color-positive)'
                  : filled >= 2
                    ? 'var(--color-warning)'
                    : 'var(--color-negative)'
                : 'var(--color-bg-active)',
              boxShadow: met ? `0 0 8px ${filled === 3 ? 'rgba(52,211,153,0.3)' : filled >= 2 ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}` : 'none',
            }}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {[
          { label: '8+ characters', met: checks.length },
          { label: 'Uppercase', met: checks.uppercase },
          { label: 'Number', met: checks.number },
        ].map(({ label, met }) => (
          <span
            key={label}
            className={`text-[11px] font-jakarta transition-colors duration-300 ${
              met ? 'text-positive' : 'text-text-disabled'
            }`}
          >
            {met ? '\u2713' : '\u2022'} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RetailAuthPage() {
  const router = useRouter();
  const { loginWithEmail, registerRetail, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);

  // PartyLayer hooks — useConnect gives us a direct Promise<Session>
  const { connect } = useConnect();
  const { wallets } = useWallets();

  const passwordChecks = checkPassword(password);
  const passwordValid = passwordChecks.length && passwordChecks.uppercase && passwordChecks.number;

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    clearError();
    setFormError(null);
  }, [clearError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mode === 'register') {
      if (!passwordValid) {
        setFormError('Password does not meet requirements');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      if (!termsAccepted) {
        setFormError('Please accept the Terms of Service');
        return;
      }
      try {
        await registerRetail(email, password);
        router.push('/overview');
      } catch {
        // Error handled by store
      }
    } else {
      try {
        await loginWithEmail(email, password);
        router.push('/overview');
      } catch {
        // Error handled by store
      }
    }
  }, [mode, email, password, confirmPassword, passwordValid, termsAccepted, loginWithEmail, registerRetail, router]);

  // Connect to a specific wallet using useConnect() — returns Session directly
  const handleWalletSelect = useCallback(async (walletId: string) => {
    setFormError(null);
    clearError();
    setConnectingWalletId(walletId);
    setWalletConnecting(true);

    try {
      const session = await connect({ walletId: walletId as WalletId });

      if (!session) {
        setFormError('Wallet connection was cancelled.');
        setWalletConnecting(false);
        setConnectingWalletId(null);
        return;
      }

      setWalletPickerOpen(false);

      const walletAddress = String(session.partyId);
      const signature = String(session.sessionId);
      const connectedWalletId = String(session.walletId);

      const { data: nonceData } = await authApi.getWalletNonce(walletAddress);
      await useAuthStore.getState().loginWithWallet(walletAddress, signature, nonceData.nonce);
      useWalletStore.getState().setConnected(walletAddress, connectedWalletId, 'canton-native');

      router.push('/overview');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Wallet connection failed.';
      setFormError(msg);
      setWalletConnecting(false);
      setConnectingWalletId(null);
    }
  }, [connect, router, clearError]);

  const displayError = formError || error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[460px] pt-4"
    >
      {/* Headline */}
      <div className="text-center mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] text-text-primary leading-tight tracking-tight">
              {mode === 'login' ? 'Welcome to Dualis' : 'Create Your Account'}
            </h1>
            <p className="font-jakarta text-[14px] text-text-secondary mt-2">
              {mode === 'login'
                ? 'Connect your wallet or sign in with email'
                : 'Get started with email or wallet'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Glass card */}
      <div className="relative rounded-2xl p-[1px]"
        style={{
          background: 'linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(129,140,248,0.06) 50%, rgba(45,212,191,0.04) 100%)',
        }}
      >
        <div className="relative bg-bg-tertiary/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-border-default/30">
          {/* Wallet Connect */}
          <button
            type="button"
            onClick={() => { setFormError(null); clearError(); setWalletPickerOpen(true); }}
            disabled={walletConnecting}
            className="w-full h-12 rounded-xl font-jakarta font-medium text-sm text-text-primary flex items-center justify-center gap-2.5 transition-all duration-300 border border-border-default/60 hover:border-accent-teal/30 bg-bg-elevated/50 hover:bg-bg-elevated relative group"
            style={{ boxShadow: '0 0 0 0 rgba(45,212,191,0)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(45,212,191,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 0 0 rgba(45,212,191,0)'; }}
          >
            {walletConnecting ? (
              <><Loader2 className="w-5 h-5 text-accent-teal animate-spin" /> Connecting...</>
            ) : (
              <><Wallet className="w-5 h-5 text-accent-teal" /> Connect Wallet</>
            )}
          </button>

          {/* Gradient divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.12) 50%, transparent 100%)' }} />
            <span className="text-[11px] text-text-disabled font-jakarta tracking-wide uppercase">or</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.12) 50%, transparent 100%)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                iconRight={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-tertiary hover:text-text-secondary transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4 overflow-hidden"
                >
                  {password.length > 0 && <PasswordStrengthBar checks={passwordChecks} />}
                  <Input label="Confirm Password" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={confirmPassword && confirmPassword !== password ? 'Passwords do not match' : undefined} required />
                  <label className="flex items-start gap-3 cursor-pointer group/terms">
                    <div
                      className={`mt-0.5 w-[18px] h-[18px] rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-200 border ${termsAccepted ? 'bg-accent-teal border-accent-teal' : 'border-border-medium bg-bg-elevated hover:border-text-tertiary'}`}
                      onClick={() => setTermsAccepted(!termsAccepted)}
                    >
                      {termsAccepted && (
                        <svg className="w-3 h-3 text-text-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] text-text-tertiary font-jakarta leading-snug" onClick={() => setTermsAccepted(!termsAccepted)}>
                      I agree to the <span className="text-accent-teal hover:underline cursor-pointer">Terms of Service</span> and <span className="text-accent-teal hover:underline cursor-pointer">Privacy Policy</span>
                    </span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {displayError && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2 text-xs text-negative font-jakarta bg-negative/5 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {displayError}
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" variant="primary" size="lg" className="w-full h-12 mt-2" loading={isLoading}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <Link href="/auth/forgot-password" className="text-[13px] text-text-tertiary hover:text-accent-teal font-jakarta transition-colors">Forgot password?</Link>
            </div>
          )}

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid', borderImage: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.1) 50%, transparent 100%) 1' }}>
            <p className="text-[13px] text-text-tertiary font-jakarta">
              {mode === 'login' ? (
                <>Don&apos;t have an account?{' '}<button onClick={() => switchMode('register')} className="text-accent-teal hover:text-accent-teal-hover font-medium transition-colors">Register</button></>
              ) : (
                <>Already have an account?{' '}<button onClick={() => switchMode('login')} className="text-accent-teal hover:text-accent-teal-hover font-medium transition-colors">Sign in</button></>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/auth" className="text-[13px] text-text-tertiary hover:text-text-secondary font-jakarta inline-flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to account type
        </Link>
      </div>

      {/* Wallet picker overlay */}
      <AnimatePresence>
        {walletPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!walletConnecting) setWalletPickerOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm mx-4 bg-bg-secondary border border-border-default rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="font-display text-lg text-text-primary">Connect Wallet</h2>
                <button onClick={() => { if (!walletConnecting) setWalletPickerOpen(false); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-tertiary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 pb-6 space-y-2">
                {wallets.length === 0 ? (
                  <div className="py-8 text-center text-text-tertiary text-sm font-jakarta">
                    <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-accent-teal" />
                    Loading wallets...
                  </div>
                ) : (
                  wallets.map((w) => (
                    <button
                      key={w.walletId}
                      onClick={() => handleWalletSelect(String(w.walletId))}
                      disabled={walletConnecting}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border-default/60 hover:border-accent-teal/30 bg-bg-elevated/50 hover:bg-bg-elevated transition-all duration-200 disabled:opacity-50 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-bg-tertiary border border-border-default flex items-center justify-center overflow-hidden flex-shrink-0">
                        {w.icons?.sm ? (
                          <img src={w.icons.sm} alt={w.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <Wallet className="w-5 h-5 text-accent-teal" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-jakarta font-medium text-text-primary group-hover:text-accent-teal transition-colors">{w.name}</p>
                        <p className="text-[11px] text-text-disabled font-jakarta">{w.category || 'Canton Wallet'}</p>
                      </div>
                      {connectingWalletId === String(w.walletId) ? (
                        <Loader2 className="w-4 h-4 text-accent-teal animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 text-text-disabled group-hover:text-accent-teal transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="px-6 pb-5">
                <p className="text-[11px] text-text-disabled font-jakarta text-center">CIP-0103 compliant wallets on Canton Network</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
