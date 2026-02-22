'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, User, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const INSTITUTIONAL_FEATURES = [
  'API access',
  'Bulk operations',
  'Custom fees',
  'Dedicated support',
];

const RETAIL_FEATURES = [
  'Instant access',
  'Email or wallet',
  'No minimum',
  'Full DeFi suite',
];

export default function AuthPage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[800px]"
    >
      <div className="text-center mb-10">
        <h1 className="font-jakarta font-bold text-[28px] text-text-primary tracking-[-0.02em]">
          Choose Your Account Type
        </h1>
        <p className="font-jakarta text-[15px] text-text-secondary mt-2 max-w-[480px] mx-auto">
          Select how you&apos;d like to access the protocol
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Institutional Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          whileHover={{ y: -2 }}
          className="bg-bg-tertiary border border-border-default rounded-2xl p-8 cursor-pointer transition-all duration-200 hover:border-border-strong hover:shadow-card-hover group"
          onClick={() => router.push('/auth/institutional')}
        >
          <div className="w-12 h-12 rounded-lg bg-bg-elevated flex items-center justify-center mb-5">
            <Building2 className="w-6 h-6 text-accent-teal" />
          </div>
          <h2 className="font-jakarta font-semibold text-xl text-text-primary">
            Institutional
          </h2>
          <p className="font-jakarta text-sm text-text-secondary mt-2 leading-relaxed">
            For companies, funds, and financial institutions
          </p>
          <ul className="mt-5 space-y-2">
            {INSTITUTIONAL_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-positive shrink-0" />
                <span className="font-jakarta text-[13px] text-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>
          <p className="font-jakarta text-xs text-text-tertiary italic mt-4">
            KYB/KYC required &middot; 1-5 business days
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-6"
            iconRight={<ArrowRight className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              router.push('/auth/institutional');
            }}
          >
            Get Started
          </Button>
        </motion.div>

        {/* Retail Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          whileHover={{ y: -2 }}
          className="bg-bg-tertiary border border-border-default rounded-2xl p-8 cursor-pointer transition-all duration-200 hover:border-border-strong hover:shadow-card-hover group"
          onClick={() => router.push('/auth/retail')}
        >
          <div className="w-12 h-12 rounded-lg bg-bg-elevated flex items-center justify-center mb-5">
            <User className="w-6 h-6 text-accent-teal" />
          </div>
          <h2 className="font-jakarta font-semibold text-xl text-text-primary">
            Individual
          </h2>
          <p className="font-jakarta text-sm text-text-secondary mt-2 leading-relaxed">
            For traders and individual DeFi participants
          </p>
          <ul className="mt-5 space-y-2">
            {RETAIL_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-positive shrink-0" />
                <span className="font-jakarta text-[13px] text-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4" /> {/* Spacer to match institutional card height */}
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-6"
            iconRight={<ArrowRight className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              router.push('/auth/retail');
            }}
          >
            Get Started
          </Button>
        </motion.div>
      </div>

      <div className="text-center mt-8">
        <p className="font-jakarta text-sm text-text-tertiary">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-accent-teal hover:underline">
            Sign in &rarr;
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
