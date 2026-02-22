'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checks = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
  }), [password]);

  const segments = [checks.length, checks.upper, checks.number];
  const filled = segments.filter(Boolean).length;

  const isValid = useMemo(() => {
    return checks.length && checks.upper && checks.number && password === confirmPassword;
  }, [checks, password, confirmPassword]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    if (!isValid) return;

    setError(null);
    setIsLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }, [token, password, isValid]);

  // Invalid token state
  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[460px] pt-4"
      >
        <div className="relative rounded-2xl p-[1px]"
          style={{
            background: 'linear-gradient(135deg, rgba(248,113,113,0.1) 0%, rgba(129,140,248,0.06) 50%, rgba(248,113,113,0.04) 100%)',
          }}
        >
          <div className="relative bg-bg-tertiary/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-border-default/30 text-center">
            <div className="w-16 h-16 rounded-full bg-negative/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-negative" />
            </div>
            <h2 className="font-display text-2xl text-text-primary mb-2">
              Invalid Reset Link
            </h2>
            <p className="font-jakarta text-sm text-text-secondary mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full h-12"
              onClick={() => router.push('/auth/forgot-password')}
            >
              Request New Link
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-accent-teal font-jakarta transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[460px] pt-4"
    >
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Headline */}
            <div className="text-center mb-8">
              <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] text-text-primary leading-tight tracking-tight">
                Set New Password
              </h1>
              <p className="font-jakarta text-[14px] text-text-secondary mt-2">
                Choose a strong password for your account
              </p>
            </div>

            {/* Glass card */}
            <div className="relative rounded-2xl p-[1px]"
              style={{
                background: 'linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(129,140,248,0.06) 50%, rgba(45,212,191,0.04) 100%)',
              }}
            >
              <div className="relative bg-bg-tertiary/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-border-default/30">
                {/* Key icon */}
                <div className="flex justify-center mb-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(45,212,191,0.12) 0%, rgba(6,182,212,0.08) 100%)',
                    }}
                  >
                    <KeyRound className="w-6 h-6 text-accent-teal" />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
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

                  {/* Animated password strength bar */}
                  {password.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {segments.map((met, i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-500 ease-out"
                            style={{
                              background: met
                                ? filled === 3 ? 'var(--color-positive)' : filled >= 2 ? 'var(--color-warning)' : 'var(--color-negative)'
                                : 'var(--color-bg-active)',
                              boxShadow: met ? `0 0 8px ${filled === 3 ? 'rgba(52,211,153,0.3)' : filled >= 2 ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}` : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { label: '8+ characters', met: checks.length },
                          { label: 'Uppercase', met: checks.upper },
                          { label: 'Number', met: checks.number },
                        ].map(({ label, met }) => (
                          <span key={label} className={`text-[11px] font-jakarta transition-colors duration-300 ${met ? 'text-positive' : 'text-text-disabled'}`}>
                            {met ? '\u2713' : '\u2022'} {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
                    required
                  />

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2 text-xs text-negative font-jakarta bg-negative/5 rounded-lg px-3 py-2"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full h-12"
                    loading={isLoading}
                    disabled={!isValid}
                  >
                    Reset Password
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="relative rounded-2xl p-[1px]"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(45,212,191,0.06) 50%, rgba(52,211,153,0.04) 100%)',
              }}
            >
              <div className="relative bg-bg-tertiary/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-border-default/30">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-positive/10 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-8 h-8 text-positive" />
                </motion.div>
                <h2 className="font-display text-2xl text-text-primary mb-2">
                  Password Reset Successfully
                </h2>
                <p className="font-jakarta text-sm text-text-secondary mb-6">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full h-12"
                  onClick={() => router.push('/auth/login')}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-accent-teal font-jakarta transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </motion.div>
  );
}
