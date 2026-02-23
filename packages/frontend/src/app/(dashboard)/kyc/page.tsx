'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AMLStatus from '../../../components/compliance/AMLStatus';

const SumsubWidget = dynamic(() => import('../../../components/compliance/SumsubWidget'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type Step = 'info' | 'verify' | 'waiting' | 'result';

export default function KYCPage() {
  const [step, setStep] = useState<Step>('info');
  const [kycStatus, setKycStatus] = useState<string>('not_started');
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/compliance/kyc/status`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const status = data.status ?? 'not_started';
        setKycStatus(status);
        if (status === 'approved') setStep('result');
        else if (status === 'rejected') setStep('result');
        else if (status === 'in_progress' || status === 'pending_review') setStep('waiting');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
        <p className="mt-1 text-sm text-gray-500">Complete KYC verification to access all features</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {(['info', 'verify', 'waiting', 'result'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : ['info', 'verify', 'waiting', 'result'].indexOf(step) > i
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
            {i < 3 && <div className="h-0.5 w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 'info' && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">Before You Begin</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>Have a valid government-issued ID ready</li>
            <li>Ensure good lighting for document photos</li>
            <li>Be prepared for a short selfie verification</li>
            <li>The process typically takes 2-5 minutes</li>
          </ul>
          <button
            onClick={() => setStep('verify')}
            className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Start Verification
          </button>
        </div>
      )}

      {step === 'verify' && (
        <SumsubWidget
          onComplete={() => {
            setStep('waiting');
            setKycStatus('in_progress');
          }}
          onError={(err) => console.error('KYC error:', err)}
        />
      )}

      {step === 'waiting' && (
        <div className="rounded-lg border bg-white p-6 text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-yellow-100 p-3">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold">Verification In Progress</h2>
          <p className="mt-2 text-sm text-gray-500">We are reviewing your documents. This usually takes a few minutes.</p>
          <button
            onClick={fetchStatus}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            Check Status
          </button>
        </div>
      )}

      {step === 'result' && (
        <div className={`rounded-lg border p-6 text-center ${
          kycStatus === 'approved' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <h2 className={`text-lg font-semibold ${
            kycStatus === 'approved' ? 'text-green-800' : 'text-red-800'
          }`}>
            {kycStatus === 'approved' ? 'Verification Approved' : 'Verification Rejected'}
          </h2>
          <p className={`mt-2 text-sm ${
            kycStatus === 'approved' ? 'text-green-600' : 'text-red-600'
          }`}>
            {kycStatus === 'approved'
              ? 'Your identity has been verified. You now have full access to all features.'
              : 'Your verification was not successful. Please try again or contact support.'}
          </p>
          {kycStatus === 'rejected' && (
            <button
              onClick={() => setStep('verify')}
              className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* AML Status section */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Wallet AML Status</h2>
        <AMLStatus />
      </div>
    </div>
  );
}
