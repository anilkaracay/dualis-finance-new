'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
  ], [password]);

  if (!password) return null;

  return (
    <div className="flex gap-3 mt-1">
      {checks.map((c) => (
        <span
          key={c.label}
          className={`text-[11px] font-jakarta transition-colors ${
            c.met ? 'text-positive' : 'text-text-disabled'
          }`}
        >
          {c.met ? '\u2713' : '\u2022'} {c.label}
        </span>
      ))}
    </div>
  );
}

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

  const isValid = useMemo(() => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      password === confirmPassword
    );
  }, [password, confirmPassword]);

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

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[440px]"
      >
        <div className="bg-bg-tertiary border border-border-default rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-negative/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-negative" />
          </div>
          <h2 className="font-jakarta font-bold text-xl text-text-primary mb-2">
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

        <div className="mt-6 text-center">
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[440px]"
    >
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center mb-8">
              <h1 className="font-jakarta font-bold text-[28px] text-text-primary tracking-[-0.02em]">
                Set New Password
              </h1>
              <p className="font-jakarta text-[15px] text-text-secondary mt-2">
                Choose a strong password for your account
              </p>
            </div>

            <div className="bg-bg-tertiary border border-border-default rounded-2xl p-10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    label="New Password"
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
                  <PasswordStrength password={password} />
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {confirmPassword && password !== confirmPassword && (
                  <div className="flex items-center gap-2 text-xs text-negative font-jakarta">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Passwords do not match
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-xs text-negative font-jakarta">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {error}
                  </div>
                )}

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
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-bg-tertiary border border-border-default rounded-2xl p-10">
              <div className="w-14 h-14 rounded-full bg-accent-teal/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-accent-teal" />
              </div>
              <h2 className="font-jakarta font-bold text-xl text-text-primary mb-2">
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center">
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
