import { createHmac } from 'node:crypto';
import { env } from '../../config/env.js';
import { createChildLogger } from '../../config/logger.js';

const log = createChildLogger('sumsub-client');

function signRequest(method: string, url: string, body: string): { ts: string; sig: string } {
  const ts = Math.floor(Date.now() / 1000).toString();
  const data = ts + method.toUpperCase() + url + body;
  const sig = createHmac('sha256', env.SUMSUB_SECRET_KEY ?? '').update(data).digest('hex');
  return { ts, sig };
}

async function request(method: string, path: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = path;
  const bodyStr = body ? JSON.stringify(body) : '';
  const { ts, sig } = signRequest(method, url, bodyStr);
  const fullUrl = `${env.SUMSUB_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-App-Token': env.SUMSUB_APP_TOKEN ?? '',
    'X-App-Access-Ts': ts,
    'X-App-Access-Sig': sig,
  };
  if (body) headers['Content-Type'] = 'application/json';

  const fetchInit: RequestInit = { method, headers };
  if (body) fetchInit.body = bodyStr;

  const res = await fetch(fullUrl, fetchInit);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sumsub API error ${res.status}: ${errText}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function createApplicant(userId: string, levelName?: string): Promise<string> {
  if (env.SUMSUB_MOCK) {
    log.debug({ userId }, 'Mock: createApplicant');
    return `mock_applicant_${userId}`;
  }
  const result = await request('POST', '/resources/applicants', {
    externalUserId: userId,
    levelName: levelName ?? env.SUMSUB_KYC_LEVEL_NAME,
  });
  return result.id as string;
}

export async function generateAccessToken(applicantId: string, levelName?: string, ttl = 1800): Promise<{ token: string; userId: string }> {
  if (env.SUMSUB_MOCK) {
    log.debug({ applicantId }, 'Mock: generateAccessToken');
    return { token: `mock_token_${applicantId}_${Date.now()}`, userId: applicantId.replace('mock_applicant_', '') };
  }
  const level = levelName ?? env.SUMSUB_KYC_LEVEL_NAME;
  const result = await request('POST', `/resources/accessTokens?userId=${applicantId}&levelName=${level}&ttlInSecs=${ttl}`);
  return { token: result.token as string, userId: result.userId as string };
}

export async function getApplicantStatus(applicantId: string): Promise<{
  reviewStatus: string;
  reviewResult: string | null;
  rejectLabels: string[];
}> {
  if (env.SUMSUB_MOCK) {
    return { reviewStatus: 'completed', reviewResult: 'GREEN', rejectLabels: [] };
  }
  const result = await request('GET', `/resources/applicants/${applicantId}/status`);
  const review = result.reviewResult as Record<string, unknown> | undefined;
  return {
    reviewStatus: (result.reviewStatus as string) ?? 'init',
    reviewResult: (review?.reviewAnswer as string) ?? null,
    rejectLabels: (review?.rejectLabels as string[]) ?? [],
  };
}

export async function getApplicantDocuments(applicantId: string): Promise<Array<Record<string, unknown>>> {
  if (env.SUMSUB_MOCK) return [];
  const result = await request('GET', `/resources/applicants/${applicantId}/info/idDocs`);
  return (result.items as Array<Record<string, unknown>>) ?? [];
}

export async function resetApplicant(applicantId: string): Promise<void> {
  if (env.SUMSUB_MOCK) {
    log.debug({ applicantId }, 'Mock: resetApplicant');
    return;
  }
  await request('POST', `/resources/applicants/${applicantId}/reset`);
}
