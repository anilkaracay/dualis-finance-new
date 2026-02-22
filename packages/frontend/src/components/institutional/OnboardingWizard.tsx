'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useInstitutionalStore } from '@/stores/useInstitutionalStore';
import {
  Building2,
  Users,
  FileText,
  ShieldCheck,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

/* ─── Types ─── */

interface OnboardingWizardProps {
  onComplete?: () => void;
}

interface CompanyInfo {
  legalName: string;
  registrationNo: string;
  jurisdiction: string;
}

interface Representative {
  name: string;
  role: string;
  email: string;
}

interface ComplianceSetup {
  riskProfile: 'low' | 'medium' | 'high';
  jurisdictions: string[];
}

interface StepErrors {
  [field: string]: string;
}

/* ─── Constants ─── */

const STEPS = [
  { label: 'Company Info', icon: Building2 },
  { label: 'Representatives', icon: Users },
  { label: 'KYB Documents', icon: FileText },
  { label: 'Compliance', icon: ShieldCheck },
  { label: 'Review', icon: ClipboardCheck },
] as const;

const JURISDICTIONS = [
  { value: 'TR', label: 'Turkey' },
  { value: 'US', label: 'United States' },
  { value: 'EU', label: 'European Union' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'HK', label: 'Hong Kong' },
] as const;

const DOCUMENT_TYPES = [
  { id: 'certificate', label: 'Certificate of Incorporation', required: true },
  { id: 'articles', label: 'Articles of Association', required: true },
  { id: 'shareholders', label: 'Shareholder Registry', required: true },
  { id: 'financials', label: 'Audited Financial Statements', required: false },
  { id: 'license', label: 'Relevant Licenses / Permits', required: false },
] as const;

const COMPLIANCE_JURISDICTIONS = [
  { value: 'TR', label: 'Turkey' },
  { value: 'EU', label: 'European Union' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'SG', label: 'Singapore' },
  { value: 'CH', label: 'Switzerland' },
] as const;

/* ─── Progress Bar ─── */

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.label} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  'hidden sm:block h-px w-6 lg:w-10 transition-colors duration-300',
                  isCompleted ? 'bg-accent-teal' : 'bg-border-default'
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300',
                  isActive && 'border-accent-teal bg-accent-teal/10 text-accent-teal',
                  isCompleted && 'border-accent-teal bg-accent-teal text-text-inverse',
                  !isActive && !isCompleted && 'border-border-default text-text-tertiary'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={cn(
                  'hidden lg:block text-xs font-medium transition-colors',
                  isActive && 'text-text-primary',
                  isCompleted && 'text-accent-teal',
                  !isActive && !isCompleted && 'text-text-tertiary'
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 1: Company Information ─── */

function CompanyInfoStep({
  data,
  errors,
  onChange,
}: {
  data: CompanyInfo;
  errors: StepErrors;
  onChange: (updates: Partial<CompanyInfo>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Company Information</h3>
        <p className="text-sm text-text-secondary">
          Provide your institution&apos;s legal details for KYB verification.
        </p>
      </div>

      <Input
        label="Legal Entity Name"
        placeholder="e.g. Acme Capital Ltd."
        value={data.legalName}
        onChange={(e) => onChange({ legalName: e.target.value })}
        error={errors.legalName}
      />

      <Input
        label="Registration Number"
        placeholder="e.g. TR-MKK-2024-001"
        value={data.registrationNo}
        onChange={(e) => onChange({ registrationNo: e.target.value })}
        error={errors.registrationNo}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary text-label">
          Jurisdiction
        </label>
        <select
          value={data.jurisdiction}
          onChange={(e) => onChange({ jurisdiction: e.target.value })}
          className={cn(
            'h-9 w-full rounded-md bg-bg-tertiary border text-sm text-text-primary',
            'transition-colors duration-100 focus-ring px-3',
            errors.jurisdiction
              ? 'border-border-error focus:border-border-error'
              : 'border-border-default focus:border-border-focus'
          )}
        >
          <option value="">Select jurisdiction...</option>
          {JURISDICTIONS.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </select>
        {errors.jurisdiction && (
          <p className="text-xs text-negative">{errors.jurisdiction}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Step 2: Authorized Representatives ─── */

function RepresentativesStep({
  representatives,
  errors,
  onAdd,
  onRemove,
  onChange,
}: {
  representatives: Representative[];
  errors: StepErrors;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, updates: Partial<Representative>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Authorized Representatives</h3>
        <p className="text-sm text-text-secondary">
          Add at least one authorized representative who can act on behalf of your institution.
        </p>
      </div>

      {errors._general && (
        <div className="flex items-center gap-2 text-sm text-negative bg-negative/5 border border-negative/20 rounded-md px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors._general}
        </div>
      )}

      {representatives.map((rep, index) => (
        <Card key={index} variant="outlined" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-primary">
              Representative {index + 1}
            </span>
            {representatives.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
                Remove
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. John Smith"
              value={rep.name}
              onChange={(e) => onChange(index, { name: e.target.value })}
              error={errors[`name_${index}`]}
            />
            <Input
              label="Role / Title"
              placeholder="e.g. Chief Financial Officer"
              value={rep.role}
              onChange={(e) => onChange(index, { role: e.target.value })}
              error={errors[`role_${index}`]}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. john@acme.com"
              value={rep.email}
              onChange={(e) => onChange(index, { email: e.target.value })}
              error={errors[`email_${index}`]}
            />
          </div>
        </Card>
      ))}

      <Button variant="secondary" size="sm" onClick={onAdd} className="self-start">
        + Add Another Representative
      </Button>
    </div>
  );
}

/* ─── Step 3: KYB Documents ─── */

function DocumentsStep({
  uploadedDocs,
  onToggleDoc,
}: {
  uploadedDocs: Set<string>;
  onToggleDoc: (docId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">KYB Documents</h3>
        <p className="text-sm text-text-secondary">
          Upload the required documents for identity verification. Files are encrypted at rest.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {DOCUMENT_TYPES.map((doc) => {
          const isUploaded = uploadedDocs.has(doc.id);

          return (
            <div
              key={doc.id}
              onClick={() => onToggleDoc(doc.id)}
              className={cn(
                'group flex items-center gap-4 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200',
                isUploaded
                  ? 'border-accent-teal/40 bg-accent-teal/5'
                  : 'border-border-default hover:border-border-hover hover:bg-bg-hover/50'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                  isUploaded
                    ? 'bg-accent-teal/10 text-accent-teal'
                    : 'bg-bg-hover text-text-tertiary group-hover:text-text-secondary'
                )}
              >
                {isUploaded ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{doc.label}</span>
                  {doc.required && (
                    <Badge variant="warning" size="sm">Required</Badge>
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {isUploaded ? 'Document uploaded successfully' : 'Click to simulate upload (PDF, max 10MB)'}
                </p>
              </div>

              {isUploaded && (
                <Badge variant="success" size="sm">Uploaded</Badge>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-text-tertiary">
        For this MVP, clicking a document row simulates a successful upload.
      </p>
    </div>
  );
}

/* ─── Step 4: Compliance Setup ─── */

function ComplianceStep({
  data,
  errors,
  onChange,
}: {
  data: ComplianceSetup;
  errors: StepErrors;
  onChange: (updates: Partial<ComplianceSetup>) => void;
}) {
  const riskOptions: Array<{ value: ComplianceSetup['riskProfile']; label: string; description: string }> = [
    {
      value: 'low',
      label: 'Low Risk',
      description: 'Conservative exposure limits. Suitable for treasury management.',
    },
    {
      value: 'medium',
      label: 'Medium Risk',
      description: 'Balanced limits for diversified institutional strategies.',
    },
    {
      value: 'high',
      label: 'High Risk',
      description: 'Maximum exposure for active market participants.',
    },
  ];

  const handleJurisdictionToggle = (value: string) => {
    const current = data.jurisdictions;
    const updated = current.includes(value)
      ? current.filter((j) => j !== value)
      : [...current, value];
    onChange({ jurisdictions: updated });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Compliance Setup</h3>
        <p className="text-sm text-text-secondary">
          Configure your institution&apos;s risk profile and approved jurisdictions.
        </p>
      </div>

      {/* Risk Profile */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-secondary">Risk Profile</label>
        <div className="flex flex-col gap-2">
          {riskOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
                data.riskProfile === option.value
                  ? 'border-accent-teal bg-accent-teal/5'
                  : 'border-border-default hover:border-border-hover hover:bg-bg-hover/50'
              )}
            >
              <input
                type="radio"
                name="riskProfile"
                value={option.value}
                checked={data.riskProfile === option.value}
                onChange={() => onChange({ riskProfile: option.value })}
                className="mt-0.5 accent-accent-teal"
              />
              <div>
                <span className="text-sm font-medium text-text-primary">{option.label}</span>
                <p className="text-xs text-text-tertiary mt-0.5">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.riskProfile && (
          <p className="text-xs text-negative">{errors.riskProfile}</p>
        )}
      </div>

      {/* Jurisdiction Checkboxes */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-secondary">Approved Jurisdictions</label>
        <p className="text-xs text-text-tertiary mb-1">
          Select all jurisdictions where your institution is authorized to operate.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {COMPLIANCE_JURISDICTIONS.map((j) => (
            <label
              key={j.value}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-md border cursor-pointer transition-all duration-200',
                data.jurisdictions.includes(j.value)
                  ? 'border-accent-teal/40 bg-accent-teal/5'
                  : 'border-border-default hover:border-border-hover hover:bg-bg-hover/50'
              )}
            >
              <input
                type="checkbox"
                checked={data.jurisdictions.includes(j.value)}
                onChange={() => handleJurisdictionToggle(j.value)}
                className="accent-accent-teal"
              />
              <span className="text-sm text-text-primary">{j.label}</span>
            </label>
          ))}
        </div>
        {errors.jurisdictions && (
          <p className="text-xs text-negative">{errors.jurisdictions}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Step 5: Review & Submit ─── */

function ReviewStep({
  companyInfo,
  representatives,
  uploadedDocs,
  compliance,
  isSubmitting,
  isSubmitted,
}: {
  companyInfo: CompanyInfo;
  representatives: Representative[];
  uploadedDocs: Set<string>;
  compliance: ComplianceSetup;
  isSubmitting: boolean;
  isSubmitted: boolean;
}) {
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-gold/10">
          <Clock className="h-8 w-8 text-accent-gold" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary">Application Under Review</h3>
        <p className="text-sm text-text-secondary text-center max-w-md">
          Your institutional onboarding application has been submitted successfully. Our compliance
          team will review your documents and verify your information. This typically takes 1-3
          business days.
        </p>
        <Badge variant="warning" size="md">Under Review</Badge>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-teal/10 animate-pulse">
          <ShieldCheck className="h-8 w-8 text-accent-teal" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Processing Application...</h3>
        <p className="text-sm text-text-secondary">Verifying documents and encrypting data.</p>
      </div>
    );
  }

  const jurisdictionLabel = JURISDICTIONS.find((j) => j.value === companyInfo.jurisdiction)?.label ?? companyInfo.jurisdiction;
  const uploadedCount = uploadedDocs.size;
  const requiredCount = DOCUMENT_TYPES.filter((d) => d.required).length;
  const totalCount = DOCUMENT_TYPES.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Review & Submit</h3>
        <p className="text-sm text-text-secondary">
          Please review all information before submitting your application.
        </p>
      </div>

      {/* Company Info Summary */}
      <Card variant="outlined" padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-accent-teal" />
          <span className="text-sm font-semibold text-text-primary">Company Information</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Legal Name</span>
            <p className="text-sm text-text-primary font-medium">{companyInfo.legalName}</p>
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Registration No.</span>
            <p className="text-sm text-text-primary font-medium font-mono-nums">{companyInfo.registrationNo}</p>
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Jurisdiction</span>
            <p className="text-sm text-text-primary font-medium">{jurisdictionLabel}</p>
          </div>
        </div>
      </Card>

      {/* Representatives Summary */}
      <Card variant="outlined" padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-accent-indigo" />
          <span className="text-sm font-semibold text-text-primary">
            Authorized Representatives ({representatives.length})
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {representatives.map((rep, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-text-primary font-medium">{rep.name}</span>
              <span className="text-text-tertiary">{rep.role}</span>
              <span className="text-text-secondary ml-auto font-mono-nums text-xs">{rep.email}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Documents Summary */}
      <Card variant="outlined" padding="md">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-accent-gold" />
          <span className="text-sm font-semibold text-text-primary">
            KYB Documents ({uploadedCount}/{totalCount})
          </span>
          {uploadedCount >= requiredCount && (
            <Badge variant="success" size="sm">All Required Uploaded</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_TYPES.map((doc) => (
            <Badge
              key={doc.id}
              variant={uploadedDocs.has(doc.id) ? 'success' : 'default'}
              size="sm"
            >
              {doc.label}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Compliance Summary */}
      <Card variant="outlined" padding="md">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-positive" />
          <span className="text-sm font-semibold text-text-primary">Compliance Configuration</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Risk Profile</span>
            <p className="text-sm text-text-primary font-medium capitalize">{compliance.riskProfile}</p>
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Jurisdictions</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {compliance.jurisdictions.map((j) => (
                <Badge key={j} variant="default" size="sm">{j}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Main Component ─── */

function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { startOnboarding, submitKYB, setOnboardingStep, isLoading } = useInstitutionalStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});

  // Step 1 state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    legalName: '',
    registrationNo: '',
    jurisdiction: '',
  });

  // Step 2 state
  const [representatives, setRepresentatives] = useState<Representative[]>([
    { name: '', role: '', email: '' },
  ]);

  // Step 3 state
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  // Step 4 state
  const [compliance, setCompliance] = useState<ComplianceSetup>({
    riskProfile: 'low',
    jurisdictions: [],
  });

  // Step 5 state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: StepErrors = {};

      switch (step) {
        case 0: {
          if (!companyInfo.legalName.trim()) newErrors.legalName = 'Legal name is required';
          if (!companyInfo.registrationNo.trim()) newErrors.registrationNo = 'Registration number is required';
          if (!companyInfo.jurisdiction) newErrors.jurisdiction = 'Please select a jurisdiction';
          break;
        }
        case 1: {
          let hasError = false;
          representatives.forEach((rep, i) => {
            if (!rep.name.trim()) {
              newErrors[`name_${i}`] = 'Name is required';
              hasError = true;
            }
            if (!rep.role.trim()) {
              newErrors[`role_${i}`] = 'Role is required';
              hasError = true;
            }
            if (!rep.email.trim()) {
              newErrors[`email_${i}`] = 'Email is required';
              hasError = true;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rep.email)) {
              newErrors[`email_${i}`] = 'Invalid email format';
              hasError = true;
            }
          });
          if (hasError && representatives.length === 0) {
            newErrors._general = 'At least one representative is required';
          }
          break;
        }
        case 2: {
          const requiredDocs = DOCUMENT_TYPES.filter((d) => d.required);
          const allRequired = requiredDocs.every((d) => uploadedDocs.has(d.id));
          if (!allRequired) {
            newErrors.documents = 'All required documents must be uploaded';
          }
          break;
        }
        case 3: {
          if (!compliance.riskProfile) newErrors.riskProfile = 'Please select a risk profile';
          if (compliance.jurisdictions.length === 0) newErrors.jurisdictions = 'Select at least one jurisdiction';
          break;
        }
        default:
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [companyInfo, representatives, uploadedDocs, compliance]
  );

  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 0) {
      await startOnboarding({
        legalName: companyInfo.legalName,
        registrationNo: companyInfo.registrationNo,
        jurisdiction: companyInfo.jurisdiction,
      });
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setOnboardingStep(nextStep);
    setErrors({});
  }, [currentStep, validateStep, companyInfo, startOnboarding, setOnboardingStep]);

  const handleBack = useCallback(() => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    setOnboardingStep(prevStep);
    setErrors({});
  }, [currentStep, setOnboardingStep]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    const documents: Record<string, unknown> = {};
    uploadedDocs.forEach((docId) => {
      documents[docId] = { uploaded: true, timestamp: new Date().toISOString() };
    });

    await submitKYB(documents);

    // Simulate 3s processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsSubmitting(false);
    setIsSubmitted(true);
    onComplete?.();
  }, [uploadedDocs, submitKYB, onComplete]);

  const handleAddRep = useCallback(() => {
    setRepresentatives((prev) => [...prev, { name: '', role: '', email: '' }]);
  }, []);

  const handleRemoveRep = useCallback((index: number) => {
    setRepresentatives((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRepChange = useCallback((index: number, updates: Partial<Representative>) => {
    setRepresentatives((prev) =>
      prev.map((rep, i) => (i === index ? { ...rep, ...updates } : rep))
    );
  }, []);

  const handleToggleDoc = useCallback((docId: string) => {
    setUploadedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }, []);

  const canGoBack = useMemo(() => currentStep > 0 && !isSubmitting && !isSubmitted, [currentStep, isSubmitting, isSubmitted]);
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Card padding="lg" className="max-w-2xl mx-auto">
      {/* Step Indicator */}
      <CardHeader>
        <CardTitle>Institutional Onboarding</CardTitle>
      </CardHeader>

      <div className="mb-6">
        <StepIndicator currentStep={currentStep} />
        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-bg-hover mt-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-teal transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + (isSubmitted ? 1 : 0)) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <CardContent>
        {/* Step Content */}
        {currentStep === 0 && (
          <CompanyInfoStep
            data={companyInfo}
            errors={errors}
            onChange={(updates) => setCompanyInfo((prev) => ({ ...prev, ...updates }))}
          />
        )}
        {currentStep === 1 && (
          <RepresentativesStep
            representatives={representatives}
            errors={errors}
            onAdd={handleAddRep}
            onRemove={handleRemoveRep}
            onChange={handleRepChange}
          />
        )}
        {currentStep === 2 && (
          <DocumentsStep
            uploadedDocs={uploadedDocs}
            onToggleDoc={handleToggleDoc}
          />
        )}
        {currentStep === 3 && (
          <ComplianceStep
            data={compliance}
            errors={errors}
            onChange={(updates) => setCompliance((prev) => ({ ...prev, ...updates }))}
          />
        )}
        {currentStep === 4 && (
          <ReviewStep
            companyInfo={companyInfo}
            representatives={representatives}
            uploadedDocs={uploadedDocs}
            compliance={compliance}
            isSubmitting={isSubmitting}
            isSubmitted={isSubmitted}
          />
        )}

        {/* Navigation Buttons */}
        {!isSubmitted && (
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border-default">
            <Button
              variant="ghost"
              size="md"
              onClick={handleBack}
              disabled={!canGoBack}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Back
            </Button>

            {isLastStep ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={isSubmitting || isLoading}
                icon={<ShieldCheck className="h-4 w-4" />}
              >
                Submit Application
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                loading={isLoading}
                iconRight={<ChevronRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { OnboardingWizard, type OnboardingWizardProps };
