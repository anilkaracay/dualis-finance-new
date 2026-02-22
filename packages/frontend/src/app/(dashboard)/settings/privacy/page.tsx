'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { PrivacyToggle } from '@/components/privacy/PrivacyToggle'
import { DisclosureManager } from '@/components/privacy/DisclosureManager'
import { AuditLogViewer } from '@/components/privacy/AuditLogViewer'
import { usePrivacyStore } from '@/stores/usePrivacyStore'

export default function PrivacySettingsPage() {
  const {
    config,
    auditLog,
    isLoading,
    fetchPrivacyConfig,
    setPrivacyLevel,
    addDisclosure,
    removeDisclosure,
    fetchAuditLog,
  } = usePrivacyStore()

  useEffect(() => {
    fetchPrivacyConfig()
    fetchAuditLog()
  }, [fetchPrivacyConfig, fetchAuditLog])

  const privacyLevel = config?.privacyLevel ?? 'Public'
  const disclosureRules = config?.disclosureRules ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-xl font-semibold text-text-primary tracking-tight">
        Privacy Settings
      </h1>

      {/* Privacy Level Toggle */}
      <Card className="border-border-default bg-bg-tertiary">
        <CardHeader>
          <CardTitle>Privacy Level</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : (
            <PrivacyToggle
              currentLevel={privacyLevel}
              onChange={setPrivacyLevel}
            />
          )}
        </CardContent>
      </Card>

      {/* Disclosure Rules */}
      <Card className="border-border-default bg-bg-tertiary">
        <CardHeader>
          <CardTitle>Selective Disclosure Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : (
            <DisclosureManager
              rules={disclosureRules}
              onAdd={addDisclosure}
              onRemove={removeDisclosure}
            />
          )}
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card className="border-border-default bg-bg-tertiary">
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <AuditLogViewer
              entries={auditLog}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
