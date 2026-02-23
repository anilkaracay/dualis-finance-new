'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wallet, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { authApi } from '@/lib/api/auth';
import { useConnect, useWallets } from '@partylayer/react';
import type { WalletId } from '@partylayer/sdk';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/overview';
  const { loginWithEmail, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);

  // PartyLayer hooks — useConnect gives us a direct Promise<Session>
  const { connect } = useConnect();
  const { wallets } = useWallets();

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

  // Connect to a specific wallet using useConnect() — returns Session directly
  const handleWalletSelect = useCallback(async (walletId: string) => {
    setFormError(null);
    clearError();
    setConnectingWalletId(walletId);
    setWalletConnecting(true);

    try {
      // useConnect().connect() returns Promise<Session | null> — no stale closure issues
      const session = await connect({ walletId: walletId as WalletId });

      if (!session) {
        setFormError('Wallet connection was cancelled.');
        setWalletConnecting(false);
        setConnectingWalletId(null);
        return;
      }

      setWalletPickerOpen(false);

      // We have the session directly — authenticate with backend
      const walletAddress = String(session.partyId);
      const signature = String(session.sessionId);
      const connectedWalletId = String(session.walletId);

      const { data: nonceData } = await authApi.getWalletNonce(walletAddress);
      await useAuthStore.getState().loginWithWallet(walletAddress, signature, nonceData.nonce);
      useWalletStore.getState().setConnected(walletAddress, connectedWalletId, 'canton-native');

      router.push(redirect);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Wallet connection failed.';
      setFormError(msg);
      setWalletConnecting(false);
      setConnectingWalletId(null);
    }
  }, [connect, redirect, router, clearError]);

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

          {/* Wallet connect button */}
          <button
            type="button"
            onClick={() => { setFormError(null); clearError(); setWalletPickerOpen(true); }}
            disabled={walletConnecting}
            className="w-full h-12 rounded-xl font-jakarta font-medium text-sm text-text-primary flex items-center justify-center gap-2.5 transition-all duration-300 border border-border-default/60 hover:border-accent-teal/30 bg-bg-elevated/50 hover:bg-bg-elevated"
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

          {/* Demo login button */}
          <button
            type="button"
            onClick={() => {
              setEmail('demo@dualis.finance');
              setPassword('Demo1234!');
              setFormError(null);
              clearError();
              setTimeout(() => {
                loginWithEmail('demo@dualis.finance', 'Demo1234!')
                  .then(() => router.push(redirect))
                  .catch(() => {});
              }, 300);
            }}
            disabled={isLoading}
            className="w-full h-12 mt-3 rounded-xl font-jakarta font-medium text-sm text-accent-teal flex items-center justify-center gap-2.5 transition-all duration-300 border border-accent-teal/20 hover:border-accent-teal/40 bg-accent-teal/[0.04] hover:bg-accent-teal/[0.08]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Demo Login
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
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="font-display text-lg text-text-primary">Connect Wallet</h2>
                <button
                  onClick={() => { if (!walletConnecting) setWalletPickerOpen(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-tertiary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wallet list */}
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
                      {/* Wallet icon */}
                      <div className="w-10 h-10 rounded-lg bg-bg-tertiary border border-border-default flex items-center justify-center overflow-hidden flex-shrink-0">
                        {w.icons?.sm ? (
                          <img src={w.icons.sm} alt={w.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <Wallet className="w-5 h-5 text-accent-teal" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-jakarta font-medium text-text-primary group-hover:text-accent-teal transition-colors">
                          {w.name}
                        </p>
                        <p className="text-[11px] text-text-disabled font-jakarta">
                          {w.category || 'Canton Wallet'}
                        </p>
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

              {/* Footer */}
              <div className="px-6 pb-5">
                <p className="text-[11px] text-text-disabled font-jakarta text-center">
                  CIP-0103 compliant wallets on Canton Network
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
