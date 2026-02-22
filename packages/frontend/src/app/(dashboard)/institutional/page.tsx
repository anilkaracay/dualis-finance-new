'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { KPICard } from '@/components/data-display/KPICard'
import { InstitutionalDashboard } from '@/components/institutional/InstitutionalDashboard'
import { APIKeyManager } from '@/components/institutional/APIKeyManager'
import { useInstitutionalStore } from '@/stores/useInstitutionalStore'

export default function InstitutionalPage() {
  const {
    institution,
    apiKeys,
    isLoading,
    fetchInstitutionStatus,
  } = useInstitutionalStore()

  useEffect(() => {
    fetchInstitutionStatus()
  }, [fetchInstitutionStatus])

  const isVerified = institution?.kybStatus === 'Verified'

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-text-primary">
          Institutional
        </h1>
        {institution?.kybStatus !== 'Verified' && (
          <Link href="/institutional/onboard">
            <Button variant="primary" size="sm">
              Start Onboarding
            </Button>
          </Link>
        )}
      </div>

      {/* Not verified / no institution: onboarding prompt */}
      {(!isVerified || !institution) ? (
        <Card className="border-border-default bg-surface-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-text-primary font-medium">
              Complete institutional onboarding to access premium features
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Institutional accounts unlock API access, bulk operations, and dedicated risk profiles.
            </p>
            <Link href="/institutional/onboard" className="mt-4">
              <Button variant="primary" size="sm">
                Start Onboarding
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border-default bg-surface-card">
              <CardContent className="flex flex-col gap-2 py-4">
                <span className="text-sm text-text-secondary">KYB Status</span>
                <Badge variant="success" size="sm">
                  {institution.kybStatus}
                </Badge>
              </CardContent>
            </Card>

            <KPICard
              label="Risk Profile"
              value={institution.riskProfile?.riskCategory ?? 'N/A'}
              size="sm"
            />

            <KPICard
              label="Active API Keys"
              value={apiKeys.filter((k) => k.isActive).length}
              size="sm"
              decimals={0}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dashboard">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <InstitutionalDashboard />
            </TabsContent>

            <TabsContent value="api-keys">
              <APIKeyManager />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
