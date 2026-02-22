'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const INSTITUTIONAL_FEATURES = [
  'API access & SDKs',
  'Bulk operations',
  'Custom fee structures',
  'Dedicated support',
];

const RETAIL_FEATURES = [
  'Instant access',
  'Email or wallet login',
  'No minimum deposit',
  'Full DeFi suite',
];

export default function AuthPage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[840px] pt-4"
    >
      {/* Headline */}
      <div className="text-center mb-12">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] text-text-primary leading-tight tracking-tight">
          Choose Your Account Type
        </h1>
        <p className="font-jakarta text-[15px] text-text-secondary mt-3 max-w-[480px] mx-auto leading-relaxed">
          Select how you&apos;d like to access the Dualis protocol
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institutional Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.25 } }}
          className="relative group cursor-pointer rounded-2xl p-[1px] transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(129,140,248,0.06) 50%, rgba(45,212,191,0.04) 100%)',
          }}
          onClick={() => router.push('/auth/institutional')}
        >
          {/* Hover glow */}
          <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(45,212,191,0.08) 0%, transparent 70%)' }}
          />
          {/* Card inner */}
          <div className="relative bg-bg-tertiary/80 backdrop-blur-xl rounded-2xl p-8 h-full border border-border-default/50 group-hover:border-accent-teal/20 transition-colors duration-300">
            {/* Icon container with gradient */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(6,182,212,0.1) 100%)',
                boxShadow: '0 0 24px rgba(45,212,191,0.08)',
              }}
            >
              <Building2 className="w-6 h-6 text-accent-teal" />
            </div>
            <h2 className="font-jakarta font-semibold text-xl text-text-primary tracking-tight">
              Institutional
            </h2>
            <p className="font-jakarta text-sm text-text-secondary mt-2 leading-relaxed">
              For companies, funds, and financial institutions
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-6">
              {INSTITUTIONAL_FEATURES.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-accent-teal/8 text-accent-teal border border-accent-teal/10"
                >
                  {feature}
                </span>
              ))}
            </div>
            <p className="font-jakarta text-[11px] text-text-disabled mt-5">
              KYB/KYC required &middot; 1-5 business days
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-6 group/btn"
              iconRight={<ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />}
              onClick={(e) => {
                e.stopPropagation();
                router.push('/auth/institutional');
              }}
            >
              Get Started
            </Button>
          </div>
        </motion.div>

        {/* Individual Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.25 } }}
          className="relative group cursor-pointer rounded-2xl p-[1px] transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(129,140,248,0.08) 0%, rgba(45,212,191,0.06) 50%, rgba(129,140,248,0.04) 100%)',
          }}
          onClick={() => router.push('/auth/retail')}
        >
          {/* Hover glow */}
          <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(129,140,248,0.08) 0%, transparent 70%)' }}
          />
          {/* Card inner */}
          <div className="relative bg-bg-tertiary/80 backdrop-blur-xl rounded-2xl p-8 h-full border border-border-default/50 group-hover:border-accent-indigo/20 transition-colors duration-300">
            {/* Icon container with gradient */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(129,140,248,0.15) 0%, rgba(99,102,241,0.1) 100%)',
                boxShadow: '0 0 24px rgba(129,140,248,0.08)',
              }}
            >
              <User className="w-6 h-6 text-accent-indigo" />
            </div>
            <h2 className="font-jakarta font-semibold text-xl text-text-primary tracking-tight">
              Individual
            </h2>
            <p className="font-jakarta text-sm text-text-secondary mt-2 leading-relaxed">
              For traders and individual DeFi participants
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-6">
              {RETAIL_FEATURES.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-accent-indigo/8 text-accent-indigo border border-accent-indigo/10"
                >
                  {feature}
                </span>
              ))}
            </div>
            <div className="mt-5 h-[14px]" /> {/* Spacer to match institutional card */}
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-6 group/btn"
              iconRight={<ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />}
              onClick={(e) => {
                e.stopPropagation();
                router.push('/auth/retail');
              }}
            >
              Get Started
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Sign in link */}
      <div className="text-center mt-10">
        <p className="font-jakarta text-sm text-text-tertiary">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-accent-teal hover:text-accent-teal-hover transition-colors font-medium">
            Sign in &rarr;
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
