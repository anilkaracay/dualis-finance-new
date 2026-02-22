'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useProductiveStore } from '@/stores/useProductiveStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectType = 'SolarFarm' | 'WindFarm' | 'DataCenter' | 'TradeFinance' | 'Equipment';
type ESGRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';

const PROJECT_TYPES: { label: string; value: ProjectType }[] = [
  { label: 'Solar Farm', value: 'SolarFarm' },
  { label: 'Wind Farm', value: 'WindFarm' },
  { label: 'Data Center', value: 'DataCenter' },
  { label: 'Trade Finance', value: 'TradeFinance' },
  { label: 'Equipment', value: 'Equipment' },
];

const ESG_RATINGS: ESGRating[] = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B'];

// ─── Category Mapping ────────────────────────────────────────────────────────

function mapProjectTypeToCategory(type: ProjectType) {
  switch (type) {
    case 'SolarFarm':
      return 'SolarEnergy' as const;
    case 'WindFarm':
      return 'WindEnergy' as const;
    case 'DataCenter':
      return 'DataCenter' as const;
    case 'TradeFinance':
      return 'SupplyChain' as const;
    case 'Equipment':
      return 'EquipmentLeasing' as const;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubmitProjectPage() {
  const { isLoading, submitProject } = useProductiveStore();

  const [submitted, setSubmitted] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('SolarFarm');
  const [locationCity, setLocationCity] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [esgRating, setEsgRating] = useState<ESGRating>('A');
  const [expectedApy, setExpectedApy] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submitProject({
      category: mapProjectTypeToCategory(projectType),
      metadata: {
        name: projectName,
        projectType,
        location: `${locationCity}, ${locationCountry}`,
        capacity: `${capacity} MW`,
        description,
        esgRating,
        expectedApy: parseFloat(expectedApy) || 0,
      },
      requestedAmount: '0',
    });

    setSubmitted(true);
  };

  // ─── Success State ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="space-y-8">
        <Link
          href="/productive"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="mb-4 h-16 w-16 text-positive" />
            <h2 className="text-xl font-semibold text-text-primary">Project Submitted</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Your project has been submitted successfully and is now under review.
            </p>
            <Link href="/productive" className="mt-6">
              <Button variant="primary" size="md">
                Return to Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Form ───────────────────────────────────────────────────────────────

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
      <h1 className="text-xl font-semibold text-text-primary tracking-tight">Submit New Project</h1>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <Input
              label="Project Name"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />

            {/* Project Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary text-label">
                Project Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="h-9 w-full rounded-md border border-border-default bg-bg-tertiary px-3 text-sm text-text-primary transition-colors duration-100 focus:border-border-focus focus:outline-none"
              >
                {PROJECT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location City + Country */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Location City"
                placeholder="e.g. Istanbul"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                required
              />
              <Input
                label="Location Country"
                placeholder="e.g. Turkiye"
                value={locationCountry}
                onChange={(e) => setLocationCountry(e.target.value)}
                required
              />
            </div>

            {/* Capacity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary text-label">
                Capacity
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                  className={cn(
                    'h-9 w-full rounded-md bg-bg-tertiary border border-border-default text-sm text-text-primary placeholder:text-text-disabled',
                    'transition-colors duration-100 focus:border-border-focus focus:outline-none',
                    'pl-3 pr-12'
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                  MW
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary text-label">
                Description
              </label>
              <textarea
                placeholder="Describe your project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={cn(
                  'w-full rounded-md bg-bg-tertiary border border-border-default text-sm text-text-primary placeholder:text-text-disabled',
                  'transition-colors duration-100 focus:border-border-focus focus:outline-none',
                  'px-3 py-2 resize-none'
                )}
              />
            </div>

            {/* ESG Rating */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary text-label">
                ESG Rating
              </label>
              <select
                value={esgRating}
                onChange={(e) => setEsgRating(e.target.value as ESGRating)}
                className="h-9 w-full rounded-md border border-border-default bg-bg-tertiary px-3 text-sm text-text-primary transition-colors duration-100 focus:border-border-focus focus:outline-none"
              >
                {ESG_RATINGS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected APY */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary text-label">
                Expected APY
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expectedApy}
                  onChange={(e) => setExpectedApy(e.target.value)}
                  required
                  className={cn(
                    'h-9 w-full rounded-md bg-bg-tertiary border border-border-default text-sm text-text-primary placeholder:text-text-disabled',
                    'transition-colors duration-100 focus:border-border-focus focus:outline-none',
                    'pl-3 pr-8'
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                  %
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={!projectName || !locationCity || !locationCountry || !capacity || !expectedApy}
              >
                Submit Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
