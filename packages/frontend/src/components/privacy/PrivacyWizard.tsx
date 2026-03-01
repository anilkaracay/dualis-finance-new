'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, Eye, EyeOff, Lock, ArrowRight, ArrowLeft, Check, Network } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PrivacyLevel } from '@dualis/shared';

interface PrivacyWizardProps {
  onComplete: (selectedLevel?: PrivacyLevel) => void;
}

const STEPS = [
  { title: 'Canton Privacy', icon: Network },
  { title: 'Level Selection', icon: Shield },
  { title: 'Disclosure Rules', icon: Eye },
  { title: 'Confirmation', icon: Check },
] as const;

function PrivacyWizard({ onComplete }: PrivacyWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<PrivacyLevel>('Selective');

  const next = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const handleFinish = useCallback(() => {
    localStorage.setItem('dualis-privacy-wizard-completed', 'true');
    onComplete(selectedLevel);
  }, [onComplete, selectedLevel]);

  return (
    <Card variant="default" padding="lg" className="border-accent-teal/20 bg-gradient-to-br from-bg-tertiary to-bg-secondary">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => setStep(i)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  i === step
                    ? 'bg-accent-teal/15 text-accent-teal border border-accent-teal/30'
                    : i < step
                      ? 'bg-positive/10 text-positive'
                      : 'bg-bg-secondary text-text-tertiary',
                )}
              >
                <StepIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('w-6 h-px', i < step ? 'bg-positive/40' : 'bg-border-subtle')} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[280px]">
        {step === 0 && <StepCantonPrivacy />}
        {step === 1 && <StepLevelSelect selected={selectedLevel} onSelect={setSelectedLevel} />}
        {step === 2 && <StepDisclosureRules />}
        {step === 3 && <StepConfirmation level={selectedLevel} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-subtle">
        <Button
          variant="ghost"
          size="sm"
          onClick={prev}
          disabled={step === 0}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.setItem('dualis-privacy-wizard-completed', 'true');
            onComplete();
          }}
          className="text-text-tertiary"
        >
          Skip
        </Button>

        {step < STEPS.length - 1 ? (
          <Button variant="primary" size="sm" onClick={next} className="gap-1">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleFinish} className="gap-1">
            <Check className="h-4 w-4" /> Complete
          </Button>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function StepCantonPrivacy() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">How Privacy Works on Canton</h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        Canton Network operates with <strong>sub-transaction privacy</strong>.
        This means each participant can only see the parts of a transaction that are relevant to them.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-bg-primary/50 border border-border-subtle">
          <div className="text-xs font-semibold text-accent-teal mb-1">Encrypted Communication</div>
          <p className="text-[11px] text-text-tertiary">All transaction data is encrypted with the recipient&apos;s key. Network operators cannot see the content.</p>
        </div>
        <div className="p-3 rounded-lg bg-bg-primary/50 border border-border-subtle">
          <div className="text-xs font-semibold text-accent-teal mb-1">Blinded Merkle Tree</div>
          <p className="text-[11px] text-text-tertiary">Each participant only sees their own portion of the transaction tree.</p>
        </div>
        <div className="p-3 rounded-lg bg-bg-primary/50 border border-border-subtle">
          <div className="text-xs font-semibold text-accent-teal mb-1">Need-to-Know Access</div>
          <p className="text-[11px] text-text-tertiary">Data is only shared with stakeholders (signatory/observer). Third parties cannot access it.</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-accent-teal/5 border border-accent-teal/15">
        <p className="text-xs text-text-secondary">
          <strong className="text-accent-teal">Example:</strong> When you make a deposit, only you and the Dualis Protocol can see your position.
          Other users, regulators, or auditors cannot access this data — unless you explicitly grant permission.
        </p>
      </div>
    </div>
  );
}

function StepLevelSelect({ selected, onSelect }: { selected: PrivacyLevel; onSelect: (l: PrivacyLevel) => void }) {
  const levels: { level: PrivacyLevel; icon: React.ElementType; title: string; desc: string; tag?: string }[] = [
    { level: 'Public', icon: Eye, title: 'Standard Privacy', desc: 'All data visible to counterparties. Basic Canton privacy active.' },
    { level: 'Selective', icon: EyeOff, title: 'Enhanced Privacy', desc: 'Selective sharing. Control who sees what with disclosure rules.', tag: 'Recommended' },
    { level: 'Maximum', icon: Lock, title: 'Maximum Privacy', desc: 'Minimum data exposure. Only explicitly permitted parties can access.', tag: 'Premium' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Choose Your Privacy Level</h3>
      <p className="text-sm text-text-secondary">You can change this level at any time from settings.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {levels.map((l) => {
          const Icon = l.icon;
          const isSelected = selected === l.level;
          return (
            <button
              key={l.level}
              onClick={() => onSelect(l.level)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                isSelected
                  ? 'border-accent-teal bg-accent-teal/5 ring-1 ring-accent-teal/30'
                  : 'border-border-default hover:border-border-hover bg-bg-primary/30',
              )}
            >
              <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg mb-3', isSelected ? 'bg-accent-teal/15 text-accent-teal' : 'bg-bg-secondary text-text-tertiary')}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-text-primary">{l.title}</div>
              <p className="text-[11px] text-text-tertiary mt-1">{l.desc}</p>
              {l.tag && <span className="inline-block mt-2 text-[10px] font-medium text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full">{l.tag}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDisclosureRules() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Disclosure Rules</h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        Disclosure rules allow you to share specific data scopes with designated parties
        (regulators, auditors). For each rule, you specify:
      </p>

      <div className="space-y-2">
        {[
          { label: 'Party', desc: 'Who to share with (e.g., SEC, KPMG, SPK)' },
          { label: 'Scope', desc: 'Which data to share (Positions, Transactions, Credit Score, All)' },
          { label: 'Purpose', desc: 'Reason for sharing (e.g., Annual audit, Regulatory compliance)' },
          { label: 'Expiration', desc: 'Optional — access automatically revoked when expired' },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-bg-primary/50 border border-border-subtle">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-teal mt-1.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-text-primary">{item.label}</span>
              <span className="text-xs text-text-tertiary ml-2">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-warning/5 border border-warning/15">
        <p className="text-xs text-text-secondary">
          <strong className="text-warning">Note:</strong> Disclosure rules do not change Canton&apos;s protocol-level privacy guarantees.
          They only create additional sharing permissions on your data.
        </p>
      </div>
    </div>
  );
}

function StepConfirmation({ level }: { level: PrivacyLevel }) {
  const meta = {
    Public: { label: 'Standard Privacy', icon: Eye, color: 'text-positive' },
    Selective: { label: 'Enhanced Privacy', icon: EyeOff, color: 'text-warning' },
    Maximum: { label: 'Maximum Privacy', icon: Lock, color: 'text-negative' },
  }[level];
  const Icon = meta.icon;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Your Settings Are Ready</h3>

      <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-default">
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl bg-bg-secondary', meta.color)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">{meta.label}</div>
            <p className="text-xs text-text-tertiary mt-0.5">Selected privacy level</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-text-secondary">
        <p>When you click Complete:</p>
        <ul className="space-y-1 text-xs text-text-tertiary list-disc list-inside">
          <li>Your privacy level will be saved on Canton</li>
          <li>You can manage disclosure rules from the settings page</li>
          <li>All access checks will be recorded in the audit log</li>
          <li>You can change your level at any time</li>
        </ul>
      </div>
    </div>
  );
}

export { PrivacyWizard, type PrivacyWizardProps };
