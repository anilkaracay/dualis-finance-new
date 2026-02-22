'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Landmark, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { KPICard } from '@/components/data-display/KPICard';
import { ProjectCard } from '@/components/productive/ProjectCard';
import { ProductiveStats } from '@/components/productive/ProductiveStats';
import { useProductiveStore } from '@/stores/useProductiveStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (abs >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductiveLendingPage() {
  const { projects, pools, borrows, analytics, isLoading, fetchProjects, fetchPools, fetchBorrows } =
    useProductiveStore();

  useEffect(() => {
    fetchProjects();
    fetchPools();
    fetchBorrows();
  }, [fetchProjects, fetchPools, fetchBorrows]);

  const totalBorrowed = borrows.reduce((sum, b) => sum + parseFloat(b.loanAmount || '0'), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">Productive Lending</h1>
        <Link href="/productive/apply">
          <Button variant="primary" size="md" icon={<Plus className="h-4 w-4" />}>
            Submit Project
          </Button>
        </Link>
      </div>

      {/* KPI Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KPICard key={i} label="" value={0} loading />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Total Projects"
            value={projects.length}
            size="sm"
            decimals={0}
          />
          <KPICard
            label="Active Pools"
            value={pools.length}
            size="sm"
            decimals={0}
          />
          <KPICard
            label="Total Borrowed"
            value={totalBorrowed}
            size="sm"
            prefix="$"
            decimals={0}
          />
          <KPICard
            label="Active Borrows"
            value={borrows.length}
            size="sm"
            decimals={0}
          />
        </div>
      )}

      {/* Analytics */}
      {analytics && <ProductiveStats analytics={analytics} />}

      {/* Tabs */}
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="pools">Pools</TabsTrigger>
          <TabsTrigger value="borrows">My Borrows</TabsTrigger>
        </TabsList>

        {/* ── Projects Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="projects">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rect" height={220} />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.projectId} href={`/productive/${project.projectId}`}>
                  <ProjectCard project={project} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <Briefcase className="mb-4 h-12 w-12 text-text-tertiary" />
              <p className="text-sm">No projects found.</p>
              <Link href="/productive/apply">
                <Button variant="ghost" size="sm" className="mt-2">
                  Submit your first project
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* ── Pools Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="pools">
          <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Total Deposited
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Utilization Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    APY
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border-subtle">
                        <td className="px-4 py-3">
                          <Skeleton variant="rect" width={140} height={16} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Skeleton variant="rect" width={80} height={16} className="ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Skeleton variant="rect" width={60} height={16} className="ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Skeleton variant="rect" width={50} height={16} className="ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Skeleton variant="rect" width={60} height={20} className="mx-auto" />
                        </td>
                      </tr>
                    ))
                  : pools.map((pool) => {
                      const totalDeposited = parseFloat(pool.totalDeposited);
                      const totalLent = parseFloat(pool.totalLent);
                      const utilization = totalDeposited > 0 ? totalLent / totalDeposited : 0;
                      return (
                        <tr
                          key={pool.poolId}
                          className="border-b border-border-subtle h-14 transition-colors hover:bg-bg-hover/50"
                        >
                          <td className="px-4">
                            <div className="flex items-center gap-2">
                              <Landmark className="h-4 w-4 text-accent-teal" />
                              <span className="font-medium text-text-primary">{pool.poolId}</span>
                              <Badge variant="default" size="sm">
                                {pool.category}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 text-right font-mono tabular-nums text-text-primary">
                            {formatUSD(totalDeposited)}
                          </td>
                          <td className="px-4 text-right font-mono tabular-nums text-text-primary">
                            {(utilization * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 text-right font-mono tabular-nums text-accent-teal">
                            {pool.avgReturn.toFixed(2)}%
                          </td>
                          <td className="px-4 text-center">
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>

            {!isLoading && pools.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
                <p className="text-sm">No pools available.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Borrows Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="borrows">
          <div className="overflow-x-auto rounded-md border border-border-default bg-bg-tertiary">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Borrow ID
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Borrowed Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Collateral Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Health Factor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <tr key={i} className="border-b border-border-subtle">
                        <td className="px-4 py-3">
                          <Skeleton variant="rect" width={100} height={16} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Skeleton variant="rect" width={80} height={16} className="ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Skeleton variant="rect" width={80} height={16} className="ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Skeleton variant="rect" width={50} height={16} className="ml-auto" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Skeleton variant="rect" width={60} height={20} className="mx-auto" />
                        </td>
                      </tr>
                    ))
                  : borrows.map((borrow) => {
                      const loanAmt = parseFloat(borrow.loanAmount || '0');
                      const collateralVal = parseFloat(String(borrow.collateral?.totalValue ?? '0'));
                      const healthFactor = loanAmt > 0 ? collateralVal / loanAmt : 0;

                      return (
                        <tr
                          key={borrow.borrowId}
                          className="border-b border-border-subtle h-14 transition-colors hover:bg-bg-hover/50"
                        >
                          <td className="px-4">
                            <span className="font-mono text-sm text-text-primary">{borrow.borrowId}</span>
                          </td>
                          <td className="px-4 text-right font-mono tabular-nums text-text-primary">
                            {formatUSD(loanAmt)}
                          </td>
                          <td className="px-4 text-right font-mono tabular-nums text-text-primary">
                            {formatUSD(collateralVal)}
                          </td>
                          <td className="px-4 text-right">
                            <span
                              className={cn(
                                'font-mono tabular-nums font-medium',
                                healthFactor >= 1.5
                                  ? 'text-positive'
                                  : healthFactor >= 1.0
                                    ? 'text-warning'
                                    : 'text-negative'
                              )}
                            >
                              {healthFactor.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 text-center">
                            <Badge
                              variant={borrow.status === 'Active' ? 'success' : 'default'}
                              size="sm"
                            >
                              {borrow.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>

            {!isLoading && borrows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
                <DollarSign className="mb-4 h-12 w-12 text-text-tertiary" />
                <p className="text-sm">No active borrows.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
