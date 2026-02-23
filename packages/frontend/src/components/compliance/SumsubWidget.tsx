'use client';

import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

interface SumsubWidgetProps {
  onComplete?: (status: string) => void;
  onError?: (error: string) => void;
  lang?: 'tr' | 'en';
}

export default function SumsubWidget({ onComplete, onError, lang = 'en' }: SumsubWidgetProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [SumsubComponent, setSumsubComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/compliance/kyc/initiate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to initiate KYC');
      const data = await res.json();
      setAccessToken(data.token);
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  useEffect(() => {
    // Dynamically import Sumsub SDK
    import('@sumsub/websdk-react')
      .then((mod) => {
        setSumsubComponent(() => (mod as Record<string, unknown>).default as React.ComponentType<Record<string, unknown>>);
      })
      .catch(() => {
        // SDK not available — show fallback
        setError('Sumsub SDK not available');
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <span className="ml-3 text-gray-600">Loading verification...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchToken}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!accessToken) {
    return <div className="p-6 text-center text-gray-500">No access token available</div>;
  }

  if (!SumsubComponent) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
        <p className="text-yellow-700">KYC verification widget is loading...</p>
        <p className="mt-2 text-sm text-yellow-600">
          Token generated: {accessToken.slice(0, 20)}...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <SumsubComponent
        accessToken={accessToken}
        expirationHandler={fetchToken}
        config={{
          lang,
          theme: 'light',
        }}
        options={{ addViewportTag: false }}
        onMessage={(type: string, _payload: unknown) => {
          if (type === 'idCheck.onApplicantStatusChanged') {
            onComplete?.('completed');
          }
        }}
        onError={(err: unknown) => {
          onError?.((err as Error).message ?? 'Verification error');
        }}
      />
    </div>
  );
}
