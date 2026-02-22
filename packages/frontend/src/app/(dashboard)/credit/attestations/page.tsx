'use client'

import { useEffect, useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { AttestationCard } from '@/components/credit/AttestationCard'
import { AttestationUploadForm } from '@/components/credit/AttestationUploadForm'
import { CompositeScoreRing } from '@/components/credit/CompositeScoreRing'
import { TierProgressCard } from '@/components/credit/TierProgressCard'
import { useAttestationStore } from '@/stores/useAttestationStore'
import { useCompositeScoreStore } from '@/stores/useCompositeScoreStore'

export default function AttestationsPage() {
  const { attestations, isLoading, fetchAttestations } = useAttestationStore()
  const {
    compositeScore,
    isLoading: scoreLoading,
    fetchCompositeScore,
  } = useCompositeScoreStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchAttestations()
    fetchCompositeScore()
  }, [fetchAttestations, fetchCompositeScore])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">
          ZK Attestations
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Attestation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Attestation</DialogTitle>
            </DialogHeader>
            <AttestationUploadForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Composite Score & Tier Progress */}
      {scoreLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <CompositeScoreRing compositeScore={compositeScore} />
          <TierProgressCard compositeScore={compositeScore} />
        </div>
      )}

      {/* Attestation List */}
      <div className="space-y-4">
        <h2 className="text-label">Your Attestations</h2>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : attestations.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {attestations.map((attestation) => (
              <AttestationCard
                key={attestation.id}
                attestation={attestation}
              />
            ))}
          </div>
        ) : (
          <Card className="border-border-default bg-bg-tertiary">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShieldCheck className="mb-4 h-12 w-12 text-accent-teal" />
              <p className="text-text-primary font-medium">
                No attestations yet
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Create your first ZK attestation to start building your
                on-chain credit profile.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
