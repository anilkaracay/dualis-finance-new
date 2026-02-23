'use client';

import { useEffect } from 'react';
import { useComplianceStore } from '../../stores/useComplianceStore';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  not_screened: { label: 'Not Screened', color: 'text-gray-600', bg: 'bg-gray-100' },
  clean: { label: 'Clean', color: 'text-green-700', bg: 'bg-green-100' },
  flagged: { label: 'Flagged', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  high_risk: { label: 'High Risk', color: 'text-orange-700', bg: 'bg-orange-100' },
  blocked: { label: 'Blocked', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function AMLStatus() {
  const { amlStatus, wallets, loading, error, fetchAmlStatus } = useComplianceStore();

  useEffect(() => {
    fetchAmlStatus();
  }, [fetchAmlStatus]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border p-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-2 h-3 w-48 rounded bg-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Failed to load AML status</p>
      </div>
    );
  }

  const config = statusConfig[amlStatus] ?? statusConfig.not_screened!;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">AML Screening Status</h3>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      {wallets.length > 0 && (
        <div className="mt-3 space-y-2">
          {wallets.map((wallet) => {
            const wConfig = statusConfig[wallet.status] ?? statusConfig.not_screened!;
            return (
              <div key={wallet.walletAddress} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-500">
                  {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
                </span>
                <div className="flex items-center gap-2">
                  {wallet.riskScore != null && (
                    <span className="text-gray-400">Score: {wallet.riskScore}</span>
                  )}
                  <span className={`${wConfig.color}`}>{wConfig.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {wallets.length === 0 && (
        <p className="mt-2 text-xs text-gray-500">No wallets have been screened yet.</p>
      )}
    </div>
  );
}
