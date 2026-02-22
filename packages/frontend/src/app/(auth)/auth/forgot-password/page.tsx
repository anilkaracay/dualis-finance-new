'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[440px]"
    >
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center mb-8">
              <h1 className="font-jakarta font-bold text-[28px] text-text-primary tracking-[-0.02em]">
                Reset Password
              </h1>
              <p className="font-jakarta text-[15px] text-text-secondary mt-2">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <div className="bg-bg-tertiary border border-border-default rounded-2xl p-10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  iconRight={<Mail className="w-4 h-4 text-text-tertiary" />}
                />

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
                >
                  Send Reset Link
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
                Check Your Email
              </h2>
              <p className="font-jakarta text-sm text-text-secondary mb-1">
                We sent a password reset link to
              </p>
              <p className="font-jakarta text-sm text-text-primary font-medium mb-6">
                {email}
              </p>
              <p className="font-jakarta text-xs text-text-tertiary">
                The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
              </p>
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
