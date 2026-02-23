import { env } from '../../config/env.js';
import { createChildLogger } from '../../config/logger.js';

const log = createChildLogger('chainalysis-client');

async function apiRequest(method: string, path: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = `${env.CHAINALYSIS_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Token': env.CHAINALYSIS_API_KEY ?? '',
  };
  if (body) headers['Content-Type'] = 'application/json';

  const fetchInit: RequestInit = { method, headers };
  if (body) fetchInit.body = JSON.stringify(body);

  const res = await fetch(url, fetchInit);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Chainalysis API error ${res.status}: ${errText}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function registerTransfer(walletAddress: string, direction = 'received'): Promise<{ externalId: string }> {
  if (env.CHAINALYSIS_MOCK) {
    log.debug({ walletAddress }, 'Mock: registerTransfer');
    return { externalId: `mock_transfer_${walletAddress}` };
  }
  const result = await apiRequest('POST', '/transfers', {
    network: 'ethereum',
    asset: 'ETH',
    transferReference: walletAddress,
    direction,
  });
  return { externalId: result.externalId as string };
}

export async function getTransferExposures(externalId: string): Promise<{
  directExposure: Array<{ category: string; value: number }>;
  indirectExposure: Array<{ category: string; value: number }>;
}> {
  if (env.CHAINALYSIS_MOCK) {
    return { directExposure: [], indirectExposure: [] };
  }
  const result = await apiRequest('GET', `/transfers/${externalId}/exposures`);
  const direct = result.directExposure as Array<Record<string, unknown>> | undefined;
  const indirect = result.indirectExposure as Array<Record<string, unknown>> | undefined;
  return {
    directExposure: (direct ?? []).map((e) => ({ category: (e.category as string) ?? 'unknown', value: (e.value as number) ?? 0 })),
    indirectExposure: (indirect ?? []).map((e) => ({ category: (e.category as string) ?? 'unknown', value: (e.value as number) ?? 0 })),
  };
}

export async function getTransferAlerts(externalId: string): Promise<Array<Record<string, unknown>>> {
  if (env.CHAINALYSIS_MOCK) return [];
  const result = await apiRequest('GET', `/transfers/${externalId}/alerts`);
  return (result.alerts as Array<Record<string, unknown>>) ?? [];
}
