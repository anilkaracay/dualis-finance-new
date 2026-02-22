'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[440px]"
    >
      <div className="text-center mb-8">
        <h1 className="font-jakarta font-bold text-[28px] text-text-primary tracking-[-0.02em]">
          Welcome Back
        </h1>
        <p className="font-jakarta text-[15px] text-text-secondary mt-2">
          Sign in to access your portfolio
        </p>
      </div>

      <div className="bg-bg-tertiary border border-border-default rounded-2xl p-10">
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
            Sign In
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/auth/forgot-password" className="text-[13px] text-text-tertiary hover:text-accent-teal font-jakarta transition-colors">
            Forgot password? &rarr;
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border-default" />
          <span className="text-xs text-text-disabled font-jakarta">or</span>
          <div className="flex-1 h-px bg-border-default" />
        </div>

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
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-text-tertiary font-jakarta">
          Don&apos;t have an account?{' '}
          <Link href="/auth" className="text-accent-teal hover:underline">
            Get started &rarr;
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
