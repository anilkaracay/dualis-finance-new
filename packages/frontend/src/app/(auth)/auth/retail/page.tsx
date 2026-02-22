'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wallet, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';
import { authApi } from '@/lib/api/auth';

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

export default function RetailAuthPage() {
  const router = useRouter();
  const { loginWithEmail, registerRetail, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleWalletConnect = useCallback(async () => {
    setWalletConnecting(true);
    try {
      // Mock wallet flow — in production, use PartyLayer SDK
      const mockAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const { data: nonceData } = await authApi.getWalletNonce(mockAddress);
      const mockSignature = '0x' + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const loginWithWallet = useAuthStore.getState().loginWithWallet;
      await loginWithWallet(mockAddress, mockSignature, nonceData.nonce);
      router.push('/overview');
    } catch {
      setFormError('Wallet connection failed. Please try again.');
    } finally {
      setWalletConnecting(false);
    }
  }, [router]);

  const displayError = formError || error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[440px]"
    >
      <div className="text-center mb-8">
        <h1 className="font-jakarta font-bold text-[28px] text-text-primary tracking-[-0.02em]">
          {mode === 'login' ? 'Welcome to Dualis' : 'Create Your Account'}
        </h1>
        <p className="font-jakarta text-[15px] text-text-secondary mt-2">
          {mode === 'login'
            ? 'Connect your wallet or sign in with email'
            : 'Get started with email or wallet'}
        </p>
      </div>

      <div className="bg-bg-tertiary border border-border-default rounded-2xl p-10">
        {/* Wallet Connect */}
        <Button
          variant="secondary"
          size="lg"
          className="w-full h-12"
          icon={<Wallet className="w-5 h-5" />}
          loading={walletConnecting}
          onClick={handleWalletConnect}
        >
          Connect Wallet
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border-default" />
          <span className="text-xs text-text-disabled font-jakarta">or continue with</span>
          <div className="flex-1 h-px bg-border-default" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          {/* Password strength (register mode) */}
          <AnimatePresence>
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: '8+ chars', met: passwordChecks.length },
                    { label: 'Uppercase', met: passwordChecks.uppercase },
                    { label: 'Number', met: passwordChecks.number },
                  ].map(({ label, met }) => (
                    <span
                      key={label}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-jakarta ${
                        met
                          ? 'bg-positive/10 text-positive'
                          : 'bg-bg-active text-text-disabled'
                      }`}
                    >
                      {met ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current inline-block" />}
                      {label}
                    </span>
                  ))}
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={confirmPassword && confirmPassword !== password ? 'Passwords do not match' : undefined}
                  required
                />

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-[18px] h-[18px] rounded border-border-medium bg-bg-elevated accent-accent-teal"
                  />
                  <span className="text-[13px] text-text-tertiary font-jakarta leading-snug">
                    I agree to the{' '}
                    <span className="text-accent-teal hover:underline cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-accent-teal hover:underline cursor-pointer">Privacy Policy</span>
                  </span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {displayError && (
            <div className="flex items-center gap-2 text-xs text-negative font-jakarta">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {displayError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full h-12"
            loading={isLoading}
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-[13px] text-text-tertiary hover:text-accent-teal font-jakarta transition-colors">
              Forgot password? &rarr;
            </Link>
          </div>
        )}

        <div className="border-t border-border-default mt-6 pt-4 text-center">
          <p className="text-[13px] text-text-tertiary font-jakarta">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={() => switchMode('register')} className="text-accent-teal hover:underline">
                  Register &rarr;
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-accent-teal hover:underline">
                  Sign in &rarr;
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/auth"
          className="text-[13px] text-text-tertiary hover:text-text-secondary font-jakarta inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to account type
        </Link>
      </div>
    </motion.div>
  );
}
