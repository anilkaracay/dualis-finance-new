'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[440px]"
    >
      <div className="bg-bg-tertiary border border-border-default rounded-2xl p-10 text-center">
        {state === 'verifying' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-14 h-14 rounded-full bg-accent-teal/10 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-7 h-7 text-accent-teal animate-spin" />
            </div>
            <h2 className="font-jakarta font-bold text-xl text-text-primary mb-2">
              Verifying Email
            </h2>
            <p className="font-jakarta text-sm text-text-secondary">
              Please wait while we verify your email address...
            </p>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-14 h-14 rounded-full bg-accent-teal/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-accent-teal" />
            </div>
            <h2 className="font-jakarta font-bold text-xl text-text-primary mb-2">
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
          >
            <div className="w-14 h-14 rounded-full bg-negative/10 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-7 h-7 text-negative" />
            </div>
            <h2 className="font-jakarta font-bold text-xl text-text-primary mb-2">
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

      <div className="mt-6 text-center">
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
