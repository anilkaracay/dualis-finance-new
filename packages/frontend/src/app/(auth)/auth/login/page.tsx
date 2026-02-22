'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wallet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';
import { authApi } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/overview';
  const { loginWithEmail, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    try {
      await loginWithEmail(email, password);
      router.push(redirect);
    } catch {
      // Error handled by store
    }
  }, [email, password, loginWithEmail, router, redirect, clearError]);

  const handleWalletConnect = useCallback(async () => {
    setWalletConnecting(true);
    try {
      const mockAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const { data: nonceData } = await authApi.getWalletNonce(mockAddress);
      const mockSignature = '0x' + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const loginWithWallet = useAuthStore.getState().loginWithWallet;
      await loginWithWallet(mockAddress, mockSignature, nonceData.nonce);
      router.push(redirect);
    } catch {
      setFormError('Wallet connection failed');
    } finally {
      setWalletConnecting(false);
    }
  }, [router, redirect]);

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
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] text-text-primary leading-tight tracking-tight">
          Welcome Back
        </h1>
        <p className="font-jakarta text-[14px] text-text-secondary mt-2">
          Sign in to access your portfolio
        </p>
      </div>

      {/* Glass card */}
      <div className="relative rounded-2xl p-[1px]"
        style={{
          background: 'linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(129,140,248,0.06) 50%, rgba(45,212,191,0.04) 100%)',
        }}
      >
        <div className="relative bg-bg-tertiary/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-border-default/30">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
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

            {/* Error */}
            <AnimatePresence>
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 text-xs text-negative font-jakarta bg-negative/5 rounded-lg px-3 py-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {displayError}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-12 mt-1"
              loading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-[13px] text-text-tertiary hover:text-accent-teal font-jakarta transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Gradient divider */}
          <div className="flex items-center gap-3 my-7">
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.12) 50%, transparent 100%)' }}
            />
            <span className="text-[11px] text-text-disabled font-jakarta tracking-wide uppercase">or</span>
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.12) 50%, transparent 100%)' }}
            />
          </div>

          {/* Wallet button with glow */}
          <button
            type="button"
            onClick={handleWalletConnect}
            disabled={walletConnecting}
            className="w-full h-12 rounded-xl font-jakarta font-medium text-sm text-text-primary flex items-center justify-center gap-2.5 transition-all duration-300 border border-border-default/60 hover:border-accent-teal/30 bg-bg-elevated/50 hover:bg-bg-elevated"
            style={{ boxShadow: '0 0 0 0 rgba(45,212,191,0)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(45,212,191,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(45,212,191,0)';
            }}
          >
            <Wallet className="w-5 h-5 text-accent-teal" />
            {walletConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      {/* Bottom link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-text-tertiary font-jakarta">
          Don&apos;t have an account?{' '}
          <Link href="/auth" className="text-accent-teal hover:text-accent-teal-hover font-medium transition-colors">
            Get started
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
