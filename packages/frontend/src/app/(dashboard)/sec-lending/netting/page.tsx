'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NettingDashboard } from '@/components/sec-lending/NettingDashboard'

export default function NettingPage() {
  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/sec-lending"
        className="flex items-center gap-1 text-text-tertiary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Securities Lending
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">
          Bilateral Netting
        </h1>
        <p className="text-sm text-text-secondary">
          Reduce counterparty exposure through bilateral netting of mutual obligations.
        </p>
      </div>

      {/* Netting Dashboard */}
      <NettingDashboard />
    </div>
  )
}
