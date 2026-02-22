'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProjectDetailPanel } from '@/components/productive/ProjectDetailPanel';
import { CashflowTimeline } from '@/components/productive/CashflowTimeline';
import { HybridCollateralView } from '@/components/productive/HybridCollateralView';
import { ProductionMonitor } from '@/components/productive/ProductionMonitor';
import { ESGBadge } from '@/components/productive/ESGBadge';
import { useProductiveStore } from '@/stores/useProductiveStore';
import type { ESGRating } from '@dualis/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusVariant(status: string): 'success' | 'warning' | 'info' | 'danger' | 'default' {
  switch (status) {
    case 'Operational':
    case 'Completed':
      return 'success';
    case 'InConstruction':
    case 'Repaying':
      return 'warning';
    case 'Funded':
    case 'Proposed':
      return 'info';
    case 'Defaulted':
      return 'danger';
    default:
      return 'default';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { selectedProject, borrows, iotReadings, isLoading, fetchProjectDetail, fetchIoTReadings, fetchBorrows } =
    useProductiveStore();

  useEffect(() => {
    if (projectId) {
      fetchProjectDetail(projectId);
      fetchIoTReadings(projectId);
      fetchBorrows();
    }
  }, [projectId, fetchProjectDetail, fetchIoTReadings, fetchBorrows]);

  // ─── Loading State ────────────────────────────────────────────────────────

  if (isLoading && !selectedProject) {
    return (
      <div className="space-y-8">
        <Skeleton variant="rect" width={200} height={20} />
        <Skeleton variant="rect" width={300} height={28} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton variant="rect" height={320} />
          <Skeleton variant="rect" height={320} />
        </div>
        <Skeleton variant="rect" height={280} />
        <Skeleton variant="rect" height={280} />
      </div>
    );
  }

  // ─── Not Found ────────────────────────────────────────────────────────────

  if (!selectedProject) {
    return (
      <div className="space-y-8">
        <Link
          href="/productive"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <h2 className="text-xl font-semibold text-text-primary">Project not found</h2>
          <p className="text-sm text-text-tertiary">
            The project &quot;{projectId}&quot; does not exist or is not active.
          </p>
        </div>
      </div>
    );
  }

  const projectName = selectedProject.metadata?.location ?? selectedProject.projectId;
  const projectStatus = selectedProject.status;
  const esgRating: ESGRating = selectedProject.metadata?.esgRating ?? 'Unrated';

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/productive"
        className="inline-flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">{projectName}</h1>
        <div className="flex items-center gap-2">
          <ESGBadge rating={esgRating} />
          <Badge variant={getStatusVariant(projectStatus)} size="sm">
            {projectStatus}
          </Badge>
        </div>
      </div>

      {/* Grid: Detail Panel + Collateral */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Project Detail Panel */}
        <ProjectDetailPanel project={selectedProject} />

        {/* Right: Hybrid Collateral View */}
        {(() => {
          const borrow = borrows.find((b) => b.projectId === selectedProject.projectId);
          return borrow ? (
            <HybridCollateralView collateral={borrow.collateral} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Collateral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                  <p className="text-sm">No collateral information available.</p>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Cashflow Timeline */}
      <CashflowTimeline cashflows={borrows.find((b) => b.projectId === selectedProject.projectId)?.cashflowSchedule ?? []} />

      {/* Production Monitor */}
      <ProductionMonitor readings={iotReadings} />
    </div>
  );
}
