'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { OnboardingWizard } from '@/components/institutional/OnboardingWizard'

export default function InstitutionalOnboardPage() {
  const router = useRouter()

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/institutional"
        className="flex items-center gap-1 text-text-tertiary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Institutional
      </Link>

      {/* Header */}
      <h1 className="text-xl font-semibold text-text-primary tracking-tight">
        Institutional Onboarding
      </h1>

      {/* Onboarding Wizard */}
      <OnboardingWizard onComplete={() => router.push('/institutional')} />
    </div>
  )
}
