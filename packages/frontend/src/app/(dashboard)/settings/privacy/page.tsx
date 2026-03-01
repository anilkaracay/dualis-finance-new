'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { PrivacyToggle } from '@/components/privacy/PrivacyToggle'
import { DisclosureManager } from '@/components/privacy/DisclosureManager'
import { AuditLogViewer } from '@/components/privacy/AuditLogViewer'
import { PrivacyDashboard } from '@/components/privacy/PrivacyDashboard'
import { PrivacyWizard } from '@/components/privacy/PrivacyWizard'
import { PrivacyFlowDiagram } from '@/components/privacy/PrivacyFlowDiagram'
import { usePrivacyStore } from '@/stores/usePrivacyStore'
import type { PrivacyLevel } from '@dualis/shared'

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

  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    fetchPrivacyConfig()
    fetchAuditLog()
  }, [fetchPrivacyConfig, fetchAuditLog])

  // Show wizard on first visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('dualis-privacy-wizard-completed')
      if (!completed) {
        setShowWizard(true)
      }
    }
  }, [])

  const handleWizardComplete = (selectedLevel?: PrivacyLevel) => {
    setShowWizard(false)
    if (selectedLevel) {
      setPrivacyLevel(selectedLevel)
    }
  }

  const privacyLevel = config?.privacyLevel ?? 'Public'
  const disclosureRules = config?.disclosureRules ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-xl font-semibold text-text-primary tracking-tight">
        Privacy Settings
      </h1>

      {/* Privacy Wizard — first visit onboarding */}
      {showWizard && (
        <PrivacyWizard onComplete={handleWizardComplete} />
      )}

      {/* Privacy Dashboard — overview */}
      {!showWizard && config && (
        <PrivacyDashboard config={config} auditLog={auditLog} />
      )}

      {/* Privacy Flow Diagram */}
      {!showWizard && config && (
        <Card className="border-border-default bg-bg-tertiary">
          <CardContent className="pt-6">
            <PrivacyFlowDiagram config={config} />
          </CardContent>
        </Card>
      )}

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
          <CardTitle>Disclosure Rules</CardTitle>
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
