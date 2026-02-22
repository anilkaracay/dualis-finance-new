'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Building2,
  FileUp,
  ShieldCheck,
  Users,
  ClipboardCheck,
  Check,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Upload,
  FileText,
  ImageIcon,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepDef {
  id: number;
  label: string;
  icon: React.ElementType;
}

const STEPS: StepDef[] = [
  { id: 1, label: 'Account', icon: UserPlus },
  { id: 2, label: 'Verify Email', icon: Mail },
  { id: 3, label: 'Company', icon: Building2 },
  { id: 4, label: 'Documents', icon: FileUp },
  { id: 5, label: 'KYC', icon: ShieldCheck },
  { id: 6, label: 'UBO', icon: Users },
  { id: 7, label: 'Review', icon: ClipboardCheck },
];

interface UploadedDoc {
  name: string;
  type: string;
  size: number;
  progress: number;
}

interface BeneficialOwner {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  nationality: string;
  ownershipPct: string;
  isPEP: boolean;
  idDocType: string;
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  return (
    <>
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-center gap-0 overflow-hidden w-full mb-8">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {/* Circle */}
                <div
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-accent-teal text-text-inverse'
                      : isCurrent
                        ? 'bg-transparent border-2 border-accent-teal text-accent-teal'
                        : 'bg-transparent border border-border-medium text-text-disabled'
                  }`}
                  style={isCurrent ? { boxShadow: '0 0 12px rgba(45,212,191,0.25)' } : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <StepIcon className="w-3.5 h-3.5" />
                  ) : (
                    step.id
                  )}
                </div>
                {/* Label — only for current */}
                {isCurrent && (
                  <span className="text-[11px] font-jakarta font-medium text-accent-teal truncate">
                    {step.label}
                  </span>
                )}
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 min-w-[8px]">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      background: isCompleted
                        ? 'linear-gradient(90deg, var(--color-accent-teal) 0%, var(--color-accent-teal) 100%)'
                        : 'var(--color-border-default)',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact horizontal with progress bar */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-jakarta font-medium text-accent-teal">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-[12px] font-jakarta text-text-tertiary">
            {STEPS[currentStep - 1]?.label}
          </span>
        </div>
        <div className="h-1 bg-bg-active rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--color-accent-teal) 0%, #06B6D4 100%)' }}
            initial={false}
            animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Account Creation
// ---------------------------------------------------------------------------

function AccountStep({
  form,
  setForm,
  errors,
}: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  errors: Record<string, string>;
}) {
  const [showPw, setShowPw] = useState(false);
  const pw = form.password || '';
  const checks = { length: pw.length >= 8, upper: /[A-Z]/.test(pw), number: /\d/.test(pw) };
  const segments = [checks.length, checks.upper, checks.number];
  const filled = segments.filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-jakarta font-semibold text-lg text-text-primary">Create Your Account</h2>
        <p className="text-sm text-text-secondary mt-1">Set up your institutional credentials</p>
      </div>

      <Input
        label="Company Name"
        placeholder="Acme Capital Ltd"
        value={form.companyName || ''}
        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
        error={errors.companyName}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="John"
          value={form.repFirstName || ''}
          onChange={(e) => setForm({ ...form, repFirstName: e.target.value })}
          error={errors.repFirstName}
          required
        />
        <Input
          label="Last Name"
          placeholder="Smith"
          value={form.repLastName || ''}
          onChange={(e) => setForm({ ...form, repLastName: e.target.value })}
          error={errors.repLastName}
          required
        />
      </div>

      <Input
        label="Title / Role"
        placeholder="Chief Financial Officer"
        value={form.repTitle || ''}
        onChange={(e) => setForm({ ...form, repTitle: e.target.value })}
        error={errors.repTitle}
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="john@acme.com"
        value={form.email || ''}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={errors.email}
        required
      />

      <Input
        label="Password"
        type={showPw ? 'text' : 'password'}
        placeholder="Create a strong password"
        value={form.password || ''}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password}
        required
        iconRight={
          <button type="button" onClick={() => setShowPw(!showPw)} className="text-text-tertiary hover:text-text-secondary transition-colors">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      {/* Password strength bar */}
      {pw.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {segments.map((met, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-500 ease-out"
                style={{
                  background: met
                    ? filled === 3 ? 'var(--color-positive)' : filled >= 2 ? 'var(--color-warning)' : 'var(--color-negative)'
                    : 'var(--color-bg-active)',
                }}
              />
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: '8+ characters', met: checks.length },
              { label: 'Uppercase', met: checks.upper },
              { label: 'Number', met: checks.number },
            ].map(({ label, met }) => (
              <span key={label} className={`text-[11px] font-jakarta transition-colors ${met ? 'text-positive' : 'text-text-disabled'}`}>
                {met ? '\u2713' : '\u2022'} {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Email Verification
// ---------------------------------------------------------------------------

function EmailVerifyStep({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mock: auto-fill after 2s for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      const code = ['3', '8', '7', '2', '1', '5'];
      setDigits(code);
      setTimeout(() => {
        setVerified(true);
        onVerified();
      }, 600);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onVerified]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d.length === 1)) {
      setTimeout(() => {
        setVerified(true);
        onVerified();
      }, 500);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div className="text-center space-y-6">
      {/* Animated envelope icon */}
      <div className="flex justify-center">
        <motion.div
          animate={verified ? { scale: [1, 1.1, 1] } : { y: [0, -4, 0] }}
          transition={verified ? { duration: 0.3 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            verified ? 'bg-positive/10' : 'bg-accent-teal/10'
          }`}
        >
          {verified ? (
            <Check className="w-8 h-8 text-positive" />
          ) : (
            <Mail className="w-8 h-8 text-accent-teal" />
          )}
        </motion.div>
      </div>

      <div>
        <h2 className="font-jakarta font-semibold text-lg text-text-primary">
          {verified ? 'Email Verified' : 'Verify Your Email'}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {verified ? 'Your email has been confirmed' : `We sent a 6-digit code to ${email}`}
        </p>
      </div>

      {!verified && (
        <>
          {/* OTP inputs */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 rounded-lg bg-bg-elevated border border-border-medium text-center text-xl font-mono text-text-primary focus:border-accent-teal focus:shadow-glow transition-all duration-200 focus-ring"
              />
            ))}
          </div>

          {/* Resend */}
          <div>
            {countdown > 0 ? (
              <span className="text-sm text-text-disabled font-jakarta">Resend in {countdown}s</span>
            ) : (
              <button onClick={handleResend} className="text-sm text-accent-teal hover:text-accent-teal-hover font-jakarta transition-colors">
                Resend code
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Company Information
// ---------------------------------------------------------------------------

function CompanyInfoStep({
  form,
  setForm,
  errors,
}: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-jakarta font-semibold text-lg text-text-primary">Company Information</h2>
        <p className="text-sm text-text-secondary mt-1">Tell us about your organization</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Legal Name"
          placeholder="Acme Capital Ltd"
          value={form.legalName || ''}
          onChange={(e) => setForm({ ...form, legalName: e.target.value })}
          error={errors.legalName}
          required
        />
        <Input
          label="Registration Number"
          placeholder="HRB 12345"
          value={form.regNumber || ''}
          onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
          error={errors.regNumber}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Tax ID"
          placeholder="DE123456789"
          value={form.taxId || ''}
          onChange={(e) => setForm({ ...form, taxId: e.target.value })}
          error={errors.taxId}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary text-label">Company Type</label>
          <select
            value={form.companyType || ''}
            onChange={(e) => setForm({ ...form, companyType: e.target.value })}
            className="h-11 w-full rounded-md bg-bg-tertiary border border-border-medium text-sm text-text-primary px-3 focus-ring transition-colors appearance-none cursor-pointer"
          >
            <option value="">Select type...</option>
            <option value="corporation">Corporation</option>
            <option value="llc">LLC</option>
            <option value="partnership">Partnership</option>
            <option value="fund">Investment Fund</option>
            <option value="bank">Bank / Financial Institution</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary text-label">Jurisdiction</label>
          <select
            value={form.jurisdiction || ''}
            onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
            className="h-11 w-full rounded-md bg-bg-tertiary border border-border-medium text-sm text-text-primary px-3 focus-ring transition-colors appearance-none cursor-pointer"
          >
            <option value="">Select jurisdiction...</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="de">Germany</option>
            <option value="ch">Switzerland</option>
            <option value="sg">Singapore</option>
            <option value="hk">Hong Kong</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Input
          label="Website"
          placeholder="https://acme.com"
          value={form.website || ''}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </div>

      {/* Address section */}
      <div className="pt-2">
        <p className="text-label text-text-tertiary mb-3">Registered Address</p>
        <div className="space-y-4">
          <Input
            label="Address Line 1"
            placeholder="123 Finance Street"
            value={form.address1 || ''}
            onChange={(e) => setForm({ ...form, address1: e.target.value })}
            error={errors.address1}
            required
          />
          <Input
            label="Address Line 2"
            placeholder="Suite 400 (optional)"
            value={form.address2 || ''}
            onChange={(e) => setForm({ ...form, address2: e.target.value })}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              placeholder="Zurich"
              value={form.city || ''}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              error={errors.city}
              required
            />
            <Input
              label="State / Region"
              placeholder="ZH"
              value={form.state || ''}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
            <Input
              label="Postal Code"
              placeholder="8001"
              value={form.postalCode || ''}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              error={errors.postalCode}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Document Upload
// ---------------------------------------------------------------------------

const DOC_TYPES = [
  { key: 'incorporation', label: 'Certificate of Incorporation', required: true },
  { key: 'articles', label: 'Articles of Association', required: true },
  { key: 'shareholders', label: 'Shareholder Registry', required: true },
  { key: 'financials', label: 'Financial Statements', required: false },
  { key: 'licenses', label: 'Licenses & Permits', required: false },
];

function DocumentUploadStep({
  docs,
  setDocs,
}: {
  docs: Record<string, UploadedDoc | null>;
  setDocs: (d: Record<string, UploadedDoc | null>) => void;
}) {
  const handleDrop = useCallback(
    (key: string, files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0]!;
      const doc: UploadedDoc = { name: file.name, type: file.type, size: file.size, progress: 0 };
      setDocs({ ...docs, [key]: doc });

      // Simulate upload progress
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 30 + 10;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
        }
        setDocs({ ...docs, [key]: { ...doc, progress: Math.min(p, 100) } });
      }, 300);
    },
    [docs, setDocs],
  );

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-negative/70" />;
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-info/70" />;
    return <FileText className="w-5 h-5 text-text-tertiary" />;
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-jakarta font-semibold text-lg text-text-primary">Document Upload</h2>
        <p className="text-sm text-text-secondary mt-1">Upload required compliance documents</p>
      </div>

      <div className="space-y-3">
        {DOC_TYPES.map(({ key, label, required }) => {
          const doc = docs[key];

          return (
            <div
              key={key}
              className="relative rounded-xl border border-dashed border-border-medium hover:border-accent-teal/30 bg-bg-elevated/30 transition-all duration-200 group"
            >
              {doc ? (
                // Uploaded state
                <div className="flex items-center gap-3 px-4 py-3">
                  {getFileIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-jakarta truncate">{doc.name}</p>
                    {doc.progress < 100 ? (
                      <div className="mt-1 h-1 bg-bg-active rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-accent-teal rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${doc.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-positive font-jakarta">Uploaded</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocs({ ...docs, [key]: null })}
                    className="p-1 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-negative transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // Upload zone
                <label className="flex items-center gap-3 px-4 py-4 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0 group-hover:bg-accent-teal/5 transition-colors">
                    <Upload className="w-4 h-4 text-text-tertiary group-hover:text-accent-teal transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-jakarta">{label}</p>
                    <p className="text-[11px] text-text-disabled font-jakarta">PDF, PNG, JPG up to 10MB</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold font-jakarta px-2 py-0.5 rounded-full ${
                      required ? 'bg-negative/8 text-negative' : 'bg-bg-active text-text-disabled'
                    }`}
                  >
                    {required ? 'Required' : 'Optional'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleDrop(key, e.target.files)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: KYC (Identity Verification)
// ---------------------------------------------------------------------------

function KYCStep({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');

  const startKYC = () => {
    setStatus('in_progress');
    // Mock: transition to completed after 2s
    setTimeout(() => {
      setStatus('completed');
      onComplete();
    }, 2000);
  };

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <motion.div
          animate={
            status === 'in_progress'
              ? { rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }
              : status === 'completed'
                ? { scale: [1, 1.15, 1] }
                : {}
          }
          transition={
            status === 'in_progress'
              ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
          }
          className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
            status === 'completed'
              ? 'bg-positive/10'
              : status === 'in_progress'
                ? 'bg-accent-teal/10'
                : 'bg-bg-elevated'
          }`}
        >
          {status === 'completed' ? (
            <Check className="w-10 h-10 text-positive" />
          ) : status === 'in_progress' ? (
            <Loader2 className="w-10 h-10 text-accent-teal animate-spin" />
          ) : (
            <Shield className="w-10 h-10 text-text-tertiary" />
          )}
        </motion.div>
      </div>

      <div>
        <h2 className="font-jakarta font-semibold text-lg text-text-primary">Identity Verification</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-[400px] mx-auto">
          {status === 'completed'
            ? 'Your identity has been verified successfully.'
            : status === 'in_progress'
              ? 'Verifying your identity...'
              : 'We use industry-standard identity verification to ensure compliance. This process is quick and secure.'}
        </p>
      </div>

      {status === 'not_started' && (
        <div className="bg-bg-elevated/50 rounded-xl p-5 text-left max-w-[400px] mx-auto space-y-3">
          <p className="text-[13px] text-text-secondary font-jakarta">You will need:</p>
          <ul className="space-y-2">
            {['Government-issued photo ID', 'A device with a camera', 'Good lighting for clear photos'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[13px] text-text-secondary font-jakarta">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-teal flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'not_started' && (
        <Button variant="primary" size="lg" onClick={startKYC} className="mx-auto">
          <ShieldCheck className="w-4 h-4 mr-2" />
          Start Verification
        </Button>
      )}

      {status === 'in_progress' && (
        <p className="text-sm text-text-disabled font-jakarta">Please wait while we verify your identity...</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 6: UBO Declaration
// ---------------------------------------------------------------------------

function UBOStep({
  owners,
  setOwners,
  confirmed,
  setConfirmed,
}: {
  owners: BeneficialOwner[];
  setOwners: (o: BeneficialOwner[]) => void;
  confirmed: boolean;
  setConfirmed: (c: boolean) => void;
}) {
  const totalPct = owners.reduce((sum, o) => sum + (parseFloat(o.ownershipPct) || 0), 0);

  const addOwner = () => {
    setOwners([
      ...owners,
      {
        id: Date.now().toString(),
        firstName: '',
        lastName: '',
        dob: '',
        nationality: '',
        ownershipPct: '',
        isPEP: false,
        idDocType: 'passport',
      },
    ]);
  };

  const updateOwner = (id: string, field: keyof BeneficialOwner, value: string | boolean) => {
    setOwners(owners.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const removeOwner = (id: string) => {
    if (owners.length <= 1) return;
    setOwners(owners.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-jakarta font-semibold text-lg text-text-primary">Beneficial Owners</h2>
        <p className="text-sm text-text-secondary mt-1">
          Declare all individuals with 10%+ ownership
        </p>
      </div>

      {/* Ownership total indicator */}
      <div className="flex items-center gap-3 bg-bg-elevated/50 rounded-xl px-4 py-3">
        <div className="flex-1">
          <div className="h-2 bg-bg-active rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  totalPct === 100
                    ? 'var(--color-positive)'
                    : totalPct > 100
                      ? 'var(--color-negative)'
                      : 'var(--color-accent-teal)',
              }}
              initial={false}
              animate={{ width: `${Math.min(totalPct, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <span
          className={`text-sm font-mono font-medium ${
            totalPct === 100 ? 'text-positive' : totalPct > 100 ? 'text-negative' : 'text-accent-teal'
          }`}
        >
          {totalPct}%
        </span>
      </div>

      {/* Owners */}
      <div className="space-y-4">
        {owners.map((owner, idx) => (
          <div key={owner.id} className="rounded-xl border border-border-default/50 bg-bg-elevated/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-jakarta font-medium text-text-primary">
                Owner {idx + 1}
              </span>
              {owners.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOwner(owner.id)}
                  className="p-1 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-negative transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Jane"
                value={owner.firstName}
                onChange={(e) => updateOwner(owner.id, 'firstName', e.target.value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={owner.lastName}
                onChange={(e) => updateOwner(owner.id, 'lastName', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                value={owner.dob}
                onChange={(e) => updateOwner(owner.id, 'dob', e.target.value)}
                required
              />
              <Input
                label="Nationality"
                placeholder="Swiss"
                value={owner.nationality}
                onChange={(e) => updateOwner(owner.id, 'nationality', e.target.value)}
                required
              />
              <Input
                label="Ownership %"
                type="number"
                min="1"
                max="100"
                placeholder="25"
                value={owner.ownershipPct}
                onChange={(e) => updateOwner(owner.id, 'ownershipPct', e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary text-label">ID Document</label>
                <select
                  value={owner.idDocType}
                  onChange={(e) => updateOwner(owner.id, 'idDocType', e.target.value)}
                  className="h-11 rounded-md bg-bg-tertiary border border-border-medium text-sm text-text-primary px-3 focus-ring transition-colors appearance-none cursor-pointer"
                >
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="drivers_license">Driver&apos;s License</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-auto pb-2">
                <div
                  className={`w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all duration-200 border flex-shrink-0 ${
                    owner.isPEP
                      ? 'bg-accent-teal border-accent-teal'
                      : 'border-border-medium bg-bg-elevated hover:border-text-tertiary'
                  }`}
                  onClick={() => updateOwner(owner.id, 'isPEP', !owner.isPEP)}
                >
                  {owner.isPEP && (
                    <svg className="w-3 h-3 text-text-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-text-secondary font-jakarta">PEP</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Add owner button */}
      <button
        type="button"
        onClick={addOwner}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border-medium hover:border-accent-teal/30 text-sm text-text-tertiary hover:text-accent-teal font-jakarta transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        Add another owner
      </button>

      {/* Confirmation */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div
          className={`mt-0.5 w-[18px] h-[18px] rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-200 border ${
            confirmed
              ? 'bg-accent-teal border-accent-teal'
              : 'border-border-medium bg-bg-elevated hover:border-text-tertiary'
          }`}
          onClick={() => setConfirmed(!confirmed)}
        >
          {confirmed && (
            <svg className="w-3 h-3 text-text-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-[13px] text-text-tertiary font-jakarta leading-snug" onClick={() => setConfirmed(!confirmed)}>
          I confirm that the above information is complete and accurate to the best of my knowledge.
        </span>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 7: Review & Submit
// ---------------------------------------------------------------------------

function ReviewStep({
  accountForm,
  companyForm,
  docs,
  owners,
  kycDone,
  onGoToStep,
  submitted,
}: {
  accountForm: Record<string, string>;
  companyForm: Record<string, string>;
  docs: Record<string, UploadedDoc | null>;
  owners: BeneficialOwner[];
  kycDone: boolean;
  onGoToStep: (step: number) => void;
  submitted: boolean;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['account', 'company', 'documents', 'kyc', 'ubo']));

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (submitted) {
    return (
      <div className="text-center space-y-6 py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-positive/10 flex items-center justify-center mx-auto"
        >
          <Check className="w-10 h-10 text-positive" />
        </motion.div>
        <div>
          <h2 className="font-jakarta font-semibold text-xl text-text-primary">Application Submitted</h2>
          <p className="text-sm text-text-secondary mt-2 max-w-[400px] mx-auto">
            Your institutional onboarding application is under review. Our compliance team will review your documents within 1-5 business days.
          </p>
        </div>
        <div className="bg-bg-elevated/50 rounded-xl p-4 max-w-[360px] mx-auto">
          <div className="flex justify-between text-sm font-jakarta">
            <span className="text-text-tertiary">Application ID</span>
            <span className="font-mono text-text-primary">INS-{Date.now().toString().slice(-8)}</span>
          </div>
          <div className="flex justify-between text-sm font-jakarta mt-2">
            <span className="text-text-tertiary">Expected Timeline</span>
            <span className="text-text-primary">1-5 business days</span>
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    {
      key: 'account',
      title: 'Account Details',
      step: 1,
      items: [
        { label: 'Company', value: accountForm.companyName },
        { label: 'Representative', value: `${accountForm.repFirstName} ${accountForm.repLastName}` },
        { label: 'Title', value: accountForm.repTitle },
        { label: 'Email', value: accountForm.email },
      ],
    },
    {
      key: 'company',
      title: 'Company Information',
      step: 3,
      items: [
        { label: 'Legal Name', value: companyForm.legalName },
        { label: 'Registration', value: companyForm.regNumber },
        { label: 'Tax ID', value: companyForm.taxId },
        { label: 'Jurisdiction', value: companyForm.jurisdiction?.toUpperCase() },
        { label: 'Address', value: [companyForm.address1, companyForm.city, companyForm.postalCode].filter(Boolean).join(', ') },
      ],
    },
    {
      key: 'documents',
      title: 'Documents',
      step: 4,
      items: DOC_TYPES
        .filter(({ key }) => docs[key])
        .map(({ label, key }) => ({ label, value: docs[key]?.name ?? '' })),
    },
    {
      key: 'kyc',
      title: 'Identity Verification',
      step: 5,
      items: [{ label: 'Status', value: kycDone ? 'Verified' : 'Pending' }],
    },
    {
      key: 'ubo',
      title: 'Beneficial Owners',
      step: 6,
      items: owners.map((o) => ({
        label: `${o.firstName} ${o.lastName}`,
        value: `${o.ownershipPct}% ownership`,
      })),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-jakarta font-semibold text-lg text-text-primary">Review & Submit</h2>
        <p className="text-sm text-text-secondary mt-1">Review your application before submitting</p>
      </div>

      <div className="space-y-2">
        {sections.map(({ key, title, step, items }) => (
          <div key={key} className="rounded-xl border border-border-default/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-elevated/30 transition-colors"
            >
              <span className="text-sm font-jakarta font-medium text-text-primary">{title}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onGoToStep(step); }}
                  className="text-[11px] text-accent-teal hover:text-accent-teal-hover font-jakarta transition-colors"
                >
                  Edit
                </button>
                {openSections.has(key) ? (
                  <ChevronUp className="w-4 h-4 text-text-tertiary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-tertiary" />
                )}
              </div>
            </button>
            <AnimatePresence>
              {openSections.has(key) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 space-y-1.5">
                    {items.map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-[13px] font-jakarta">
                        <span className="text-text-tertiary">{label}</span>
                        <span className="text-text-primary text-right max-w-[60%] truncate">{value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export function InstitutionalOnboardingWizard() {
  const router = useRouter();
  const { registerInstitutional, isLoading, error } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Step 1: Account form
  const [accountForm, setAccountForm] = useState<Record<string, string>>({});
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});

  // Step 2: Email verified
  const [emailVerified, setEmailVerified] = useState(false);

  // Step 3: Company form
  const [companyForm, setCompanyForm] = useState<Record<string, string>>({});
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({});

  // Step 4: Documents
  const [docs, setDocs] = useState<Record<string, UploadedDoc | null>>({});

  // Step 5: KYC
  const [kycDone, setKycDone] = useState(false);

  // Step 6: UBO
  const [owners, setOwners] = useState<BeneficialOwner[]>([
    { id: '1', firstName: '', lastName: '', dob: '', nationality: '', ownershipPct: '', isPEP: false, idDocType: 'passport' },
  ]);
  const [uboConfirmed, setUboConfirmed] = useState(false);

  // Step 7: Submitted
  const [submitted, setSubmitted] = useState(false);

  const [stepError, setStepError] = useState<string | null>(null);

  // Validate current step
  const validateStep = useCallback((): boolean => {
    setStepError(null);

    switch (currentStep) {
      case 1: {
        const errs: Record<string, string> = {};
        if (!accountForm.companyName?.trim()) errs.companyName = 'Required';
        if (!accountForm.repFirstName?.trim()) errs.repFirstName = 'Required';
        if (!accountForm.repLastName?.trim()) errs.repLastName = 'Required';
        if (!accountForm.repTitle?.trim()) errs.repTitle = 'Required';
        if (!accountForm.email?.trim()) errs.email = 'Required';
        if (!accountForm.password || accountForm.password.length < 8) errs.password = 'Min 8 characters';
        setAccountErrors(errs);
        return Object.keys(errs).length === 0;
      }
      case 2:
        if (!emailVerified) { setStepError('Please verify your email'); return false; }
        return true;
      case 3: {
        const errs: Record<string, string> = {};
        if (!companyForm.legalName?.trim()) errs.legalName = 'Required';
        if (!companyForm.regNumber?.trim()) errs.regNumber = 'Required';
        if (!companyForm.taxId?.trim()) errs.taxId = 'Required';
        if (!companyForm.address1?.trim()) errs.address1 = 'Required';
        if (!companyForm.city?.trim()) errs.city = 'Required';
        if (!companyForm.postalCode?.trim()) errs.postalCode = 'Required';
        setCompanyErrors(errs);
        return Object.keys(errs).length === 0;
      }
      case 4: {
        const requiredDocs = DOC_TYPES.filter((d) => d.required);
        const allUploaded = requiredDocs.every((d) => docs[d.key] && docs[d.key]!.progress >= 100);
        if (!allUploaded) { setStepError('Please upload all required documents'); return false; }
        return true;
      }
      case 5:
        if (!kycDone) { setStepError('Please complete identity verification'); return false; }
        return true;
      case 6: {
        const hasEmpty = owners.some((o) => !o.firstName || !o.lastName || !o.ownershipPct);
        if (hasEmpty) { setStepError('Please fill in all owner details'); return false; }
        const total = owners.reduce((s, o) => s + (parseFloat(o.ownershipPct) || 0), 0);
        if (total !== 100) { setStepError(`Ownership must total 100% (currently ${total}%)`); return false; }
        if (!uboConfirmed) { setStepError('Please confirm the declaration'); return false; }
        return true;
      }
      default:
        return true;
    }
  }, [currentStep, accountForm, emailVerified, companyForm, docs, kycDone, owners, uboConfirmed]);

  const goNext = useCallback(async () => {
    if (!validateStep()) return;

    // Step 1: register with API
    if (currentStep === 1 && !completedSteps.has(1)) {
      try {
        await registerInstitutional({
          email: accountForm.email ?? '',
          password: accountForm.password ?? '',
          companyName: accountForm.companyName ?? '',
          repFirstName: accountForm.repFirstName ?? '',
          repLastName: accountForm.repLastName ?? '',
          repTitle: accountForm.repTitle ?? '',
        });
      } catch {
        // Error handled by store
        return;
      }
    }

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  }, [validateStep, currentStep, completedSteps, registerInstitutional, accountForm]);

  const goBack = useCallback(() => {
    setStepError(null);
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setStepError(null);
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return;
    setSubmitted(true);
    setCompletedSteps((prev) => new Set([...prev, 7]));
  }, [validateStep]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="w-full max-w-[720px] pt-4">
      {/* Glass card */}
      <div
        className="relative rounded-2xl p-[1px]"
        style={{
          background: 'linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(129,140,248,0.05) 50%, rgba(45,212,191,0.03) 100%)',
        }}
      >
        <div className="relative bg-bg-tertiary/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-border-default/30">
          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

          {/* Step Content */}
          <div className="min-h-[320px] overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {currentStep === 1 && (
                  <AccountStep form={accountForm} setForm={setAccountForm} errors={accountErrors} />
                )}
                {currentStep === 2 && (
                  <EmailVerifyStep
                    email={accountForm.email || 'your email'}
                    onVerified={() => setEmailVerified(true)}
                  />
                )}
                {currentStep === 3 && (
                  <CompanyInfoStep form={companyForm} setForm={setCompanyForm} errors={companyErrors} />
                )}
                {currentStep === 4 && (
                  <DocumentUploadStep docs={docs} setDocs={setDocs} />
                )}
                {currentStep === 5 && (
                  <KYCStep onComplete={() => setKycDone(true)} />
                )}
                {currentStep === 6 && (
                  <UBOStep
                    owners={owners}
                    setOwners={setOwners}
                    confirmed={uboConfirmed}
                    setConfirmed={setUboConfirmed}
                  />
                )}
                {currentStep === 7 && (
                  <ReviewStep
                    accountForm={accountForm}
                    companyForm={companyForm}
                    docs={docs}
                    owners={owners}
                    kycDone={kycDone}
                    onGoToStep={goToStep}
                    submitted={submitted}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Errors */}
          <AnimatePresence>
            {(stepError || error) && !submitted && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 text-xs text-negative font-jakarta bg-negative/5 rounded-lg px-3 py-2 mt-4"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {stepError || error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          {!submitted && (
            <div className="flex items-center justify-between mt-6 pt-5"
              style={{
                borderTop: '1px solid',
                borderImage: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.08) 50%, transparent 100%) 1',
              }}
            >
              <div>
                {currentStep > 1 && (
                  <Button variant="ghost" onClick={goBack} className="gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
              </div>
              <div>
                {currentStep < STEPS.length ? (
                  <Button
                    variant="primary"
                    onClick={goNext}
                    loading={isLoading}
                    className="gap-1.5"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                    className="gap-1.5"
                  >
                    <Shield className="w-4 h-4" />
                    Submit Application
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Post-submit: go to dashboard */}
          {submitted && (
            <div className="mt-6 text-center">
              <Button variant="secondary" onClick={() => router.push('/overview')} className="mx-auto">
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Back to account type */}
      {!submitted && currentStep === 1 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/auth')}
            className="text-[13px] text-text-tertiary hover:text-text-secondary font-jakarta inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to account type
          </button>
        </div>
      )}
    </div>
  );
}
