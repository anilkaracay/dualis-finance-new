'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth';

type VerifyState = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'error');
  const [errorMessage, setErrorMessage] = useState(
    token ? '' : 'Invalid verification link. No token provided.'
  );
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    authApi
      .verifyEmail(token)
      .then(() => {
        setState('success');
      })
      .catch((err) => {
        setState('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Email verification failed. The link may have expired.'
        );
      });
  }, [token]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[460px] pt-4"
    >
      {/* Glass card */}
      <div className="relative rounded-2xl p-[1px]"
        style={{
          background: state === 'error'
            ? 'linear-gradient(135deg, rgba(248,113,113,0.1) 0%, rgba(129,140,248,0.06) 50%, rgba(248,113,113,0.04) 100%)'
            : state === 'success'
              ? 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(45,212,191,0.06) 50%, rgba(52,211,153,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(45,212,191,0.1) 0%, rgba(129,140,248,0.06) 50%, rgba(45,212,191,0.04) 100%)',
        }}
      >
        <div className="relative bg-bg-tertiary/80 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-border-default/30 text-center">
          {state === 'verifying' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ y: [0, -4, 0], scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(45,212,191,0.12) 0%, rgba(6,182,212,0.08) 100%)',
                }}
              >
                <ShieldCheck className="w-10 h-10 text-accent-teal" />
              </motion.div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Loader2 className="w-4 h-4 text-accent-teal animate-spin" />
                <h2 className="font-display text-2xl text-text-primary">
                  Verifying Email
                </h2>
              </div>
              <p className="font-jakarta text-sm text-text-secondary">
                Please wait while we verify your email address...
              </p>
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-positive/10 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-positive" />
              </motion.div>
              <h2 className="font-display text-2xl text-text-primary mb-2">
                Email Verified
              </h2>
              <p className="font-jakarta text-sm text-text-secondary mb-6">
                Your email has been verified successfully. You can now access all features of your account.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full h-12"
                onClick={() => router.push('/auth/login')}
              >
                Continue to Sign In
              </Button>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-negative/10 flex items-center justify-center mx-auto mb-6"
              >
                <XCircle className="w-10 h-10 text-negative" />
              </motion.div>
              <h2 className="font-display text-2xl text-text-primary mb-2">
                Verification Failed
              </h2>
              <p className="font-jakarta text-sm text-text-secondary mb-6">
                {errorMessage}
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full h-12"
                onClick={() => router.push('/auth/login')}
              >
                Back to Sign In
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-accent-teal font-jakarta transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Account Selection
        </Link>
      </div>
    </motion.div>
  );
}
