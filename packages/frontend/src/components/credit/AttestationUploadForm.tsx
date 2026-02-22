'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  FileCheck,
  Shield,
  DollarSign,
  Building,
  Check,
} from 'lucide-react';
import type { AttestationType, ZKProof } from '@dualis/shared';

interface AttestationFormData {
  /** Selected attestation type */
  type: AttestationType;
  /** Selected provider */
  provider: string;
  /** Claimed range */
  claimedRange: string;
  /** ZK proof (simulated) */
  proof: ZKProof | null;
  /** Proof file name */
  proofFileName: string;
  /** Expiry date */
  expiresAt: string;
}

interface AttestationUploadFormProps {
  /** Callback when the form is submitted */
  onSubmit?: ((data: AttestationFormData) => void) | undefined;
  /** Callback when the form is cancelled */
  onCancel?: (() => void) | undefined;
  /** Callback when the form submission succeeds (called after onSubmit) */
  onSuccess?: (() => void) | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
}

interface TypeOption {
  value: AttestationType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: 'credit_bureau',
    label: 'Credit Bureau',
    description: 'Submit a ZK proof of your credit bureau score range.',
    icon: Shield,
  },
  {
    value: 'income_verification',
    label: 'Income Verification',
    description: 'Prove your income range without revealing exact figures.',
    icon: DollarSign,
  },
  {
    value: 'business_verification',
    label: 'Business Verification',
    description: 'Verify your business registration and standing.',
    icon: Building,
  },
];

const PROVIDER_MAP: Record<string, string[]> = {
  credit_bureau: ['Findeks', 'Experian', 'TransUnion', 'Equifax'],
  income_verification: ['Experian', 'Plaid', 'Argyle'],
  business_verification: ['TOBB', 'Dun & Bradstreet', 'Bureau van Dijk'],
};

const RANGE_MAP: Record<string, string[]> = {
  credit_bureau: ['Excellent', 'Good', 'Fair', 'Poor'],
  income_verification: ['Above 250k', 'Above 100k', 'Above 50k', 'Below 50k'],
  business_verification: ['Verified', 'Pending Review'],
};

const STEPS = ['Select Type', 'Select Provider', 'Upload Proof', 'Review & Submit'] as const;

function createMockProof(): ZKProof {
  return {
    proofData: `zkp-${Math.random().toString(36).substring(2, 15)}`,
    verifierKey: `vk-${Math.random().toString(36).substring(2, 10)}`,
    publicInputs: [`timestamp:${new Date().toISOString()}`],
    circuit: 'attestation-v1',
    generatedAt: new Date().toISOString(),
  };
}

function AttestationUploadForm({ onSubmit, onCancel, onSuccess, className }: AttestationUploadFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AttestationFormData>({
    type: 'credit_bureau',
    provider: '',
    claimedRange: '',
    proof: null,
    proofFileName: '',
    expiresAt: '',
  });

  const canAdvance = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return !!formData.type;
      case 1:
        return !!formData.provider && !!formData.claimedRange;
      case 2:
        return !!formData.proof;
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1 && canAdvance()) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, canAdvance]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleTypeSelect = useCallback((type: AttestationType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      provider: '',
      claimedRange: '',
      proof: null,
      proofFileName: '',
    }));
  }, []);

  const handleProviderSelect = useCallback((provider: string) => {
    setFormData((prev) => ({ ...prev, provider }));
  }, []);

  const handleRangeSelect = useCallback((range: string) => {
    setFormData((prev) => ({ ...prev, claimedRange: range.toLowerCase().replace(/\s+/g, '_') }));
  }, []);

  const handleFileUpload = useCallback(() => {
    // Simulate file upload - in production this would open a file picker
    const mockProof = createMockProof();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    setFormData((prev) => ({
      ...prev,
      proof: mockProof,
      proofFileName: `zk-proof-${prev.type}-${Date.now()}.json`,
      expiresAt: sixMonthsFromNow.toISOString(),
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    // Simulate 2s network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onSubmit?.(formData);
    setIsSubmitting(false);
    onSuccess?.();
  }, [formData, onSubmit, onSuccess]);

  const providers = PROVIDER_MAP[formData.type] ?? [];
  const ranges = RANGE_MAP[formData.type] ?? [];

  return (
    <Card variant="default" padding="lg" className={cn('w-full max-w-lg', className)}>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors duration-200',
                  i < currentStep
                    ? 'bg-accent-teal text-text-inverse'
                    : i === currentStep
                      ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal'
                      : 'bg-bg-secondary text-text-tertiary border border-border-default',
                )}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 whitespace-nowrap',
                  i === currentStep ? 'text-text-primary font-medium' : 'text-text-tertiary',
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-8 sm:w-12 mx-1 mt-[-14px]',
                  i < currentStep ? 'bg-accent-teal' : 'bg-border-default',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[200px]">
        {/* Step 1: Select type */}
        {currentStep === 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Select Attestation Type
            </h3>
            {TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.type === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTypeSelect(option.value)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 text-left',
                    isSelected
                      ? 'border-accent-teal bg-accent-teal/5'
                      : 'border-border-default bg-transparent hover:bg-bg-hover hover:border-border-hover',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-md',
                      isSelected ? 'bg-accent-teal/15 text-accent-teal' : 'bg-bg-secondary text-text-tertiary',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className={cn('text-sm font-medium', isSelected ? 'text-text-primary' : 'text-text-secondary')}>
                      {option.label}
                    </span>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 mt-1">
                      <Check className="h-4 w-4 text-accent-teal" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Select provider & range */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Select Provider
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {providers.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleProviderSelect(provider)}
                    className={cn(
                      'px-3 py-2 rounded-md border text-sm font-medium transition-all duration-150',
                      formData.provider === provider
                        ? 'border-accent-teal bg-accent-teal/5 text-text-primary'
                        : 'border-border-default text-text-secondary hover:bg-bg-hover hover:border-border-hover',
                    )}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Claimed Range
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {ranges.map((range) => {
                  const rangeValue = range.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <button
                      key={range}
                      type="button"
                      onClick={() => handleRangeSelect(range)}
                      className={cn(
                        'px-3 py-2 rounded-md border text-sm font-medium transition-all duration-150',
                        formData.claimedRange === rangeValue
                          ? 'border-accent-indigo bg-accent-indigo/5 text-text-primary'
                          : 'border-border-default text-text-secondary hover:bg-bg-hover hover:border-border-hover',
                      )}
                    >
                      {range}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload ZK Proof */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Upload ZK Proof
            </h3>
            <p className="text-xs text-text-tertiary">
              Generate and upload a zero-knowledge proof from your chosen provider. The proof
              verifies your claimed range without revealing the exact value.
            </p>

            {formData.proof ? (
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg border border-positive/30 bg-positive/5">
                <FileCheck className="h-10 w-10 text-positive" />
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">
                    Proof Uploaded
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {formData.proofFileName}
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    Circuit: {formData.proof.circuit}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileUpload}
                >
                  Re-upload
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFileUpload}
                className={cn(
                  'w-full flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed',
                  'border-border-default hover:border-accent-teal hover:bg-accent-teal/5',
                  'transition-all duration-200 cursor-pointer group',
                )}
              >
                <Upload className="h-8 w-8 text-text-tertiary group-hover:text-accent-teal transition-colors" />
                <div className="text-center">
                  <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                    Click to upload ZK proof
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    JSON proof file from your provider
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Review & Submit
            </h3>

            <div className="space-y-3 rounded-lg border border-border-default p-4">
              <ReviewRow
                label="Type"
                value={TYPE_OPTIONS.find((t) => t.value === formData.type)?.label ?? formData.type}
              />
              <ReviewRow label="Provider" value={formData.provider} />
              <ReviewRow
                label="Claimed Range"
                value={formData.claimedRange.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              />
              <ReviewRow label="Proof File" value={formData.proofFileName} />
              {formData.proof && (
                <ReviewRow
                  label="Circuit"
                  value={formData.proof.circuit}
                />
              )}
              {formData.expiresAt && (
                <ReviewRow
                  label="Expires"
                  value={new Date(formData.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                />
              )}
            </div>

            <p className="text-xs text-text-tertiary">
              By submitting, your ZK proof will be verified on-chain. Your private data
              will never be revealed -- only the proof of the claimed range.
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-subtle">
        <div>
          {currentStep === 0 ? (
            onCancel ? (
              <Button variant="ghost" size="md" onClick={onCancel}>
                Cancel
              </Button>
            ) : null
          ) : (
            <Button
              variant="ghost"
              size="md"
              icon={<ChevronLeft className="h-4 w-4" />}
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
        </div>

        <div>
          {currentStep < STEPS.length - 1 ? (
            <Button
              variant="primary"
              size="md"
              iconRight={<ChevronRight className="h-4 w-4" />}
              onClick={handleNext}
              disabled={!canAdvance()}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              loading={isSubmitting}
              onClick={handleSubmit}
              disabled={!canAdvance()}
            >
              Submit Attestation
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

export { AttestationUploadForm, type AttestationUploadFormProps, type AttestationFormData };
