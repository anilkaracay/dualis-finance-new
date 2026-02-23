import { eq, and, ilike } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { sanctionsListEntries } from '../../db/schema.js';
import { createChildLogger } from '../../config/logger.js';
import { logComplianceEvent } from '../audit.js';
import type { SanctionsMatchResult } from '@dualis/shared';

const log = createChildLogger('sanctions-service');

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }

  return dp[m]![n]!;
}

interface CheckOptions {
  nationality?: string;
  dateOfBirth?: string;
  aliases?: string[];
}

export async function checkSanctions(name: string, options: CheckOptions = {}): Promise<SanctionsMatchResult> {
  const db = getDb();
  if (!db) return { matched: false, result: 'clear', matches: [] };

  const normalized = normalizeName(name);

  // Query potential matches using ILIKE for initial filter
  const candidates = await db
    .select()
    .from(sanctionsListEntries)
    .where(and(eq(sanctionsListEntries.isActive, true), ilike(sanctionsListEntries.normalizedName, `%${normalized.split(' ')[0] ?? ''}%`)))
    .limit(500);

  const matches: SanctionsMatchResult['matches'] = [];

  for (const entry of candidates) {
    const entryNorm = normalizeName(entry.fullName);
    const dist = levenshteinDistance(normalized, entryNorm);
    const maxLen = Math.max(normalized.length, entryNorm.length);
    const similarity = maxLen > 0 ? 1 - dist / maxLen : 0;

    let confidence = 0;
    let matchType: 'exact' | 'fuzzy' | 'alias' | 'partial' = 'fuzzy';

    if (similarity === 1) {
      confidence = 100;
      matchType = 'exact';
    } else if (dist <= 2 && maxLen > 4) {
      confidence = 80;
      matchType = 'fuzzy';
    } else if (similarity >= 0.7) {
      confidence = 60;
      matchType = 'partial';
    } else {
      continue;
    }

    // Boost confidence with DOB match
    if (options.dateOfBirth && entry.dateOfBirth === options.dateOfBirth) {
      confidence = Math.min(confidence + 15, 100);
    }

    // Check aliases
    const aliases = entry.aliases as string[];
    if (aliases.length > 0) {
      for (const alias of aliases) {
        const aliasNorm = normalizeName(alias);
        const aliasDist = levenshteinDistance(normalized, aliasNorm);
        const aliasMaxLen = Math.max(normalized.length, aliasNorm.length);
        const aliasSim = aliasMaxLen > 0 ? 1 - aliasDist / aliasMaxLen : 0;
        if (aliasSim >= 0.8) {
          confidence = Math.max(confidence, 70);
          matchType = 'alias';
        }
      }
    }

    // Also check all provided aliases
    if (options.aliases) {
      for (const userAlias of options.aliases) {
        const userAliasNorm = normalizeName(userAlias);
        const alDist = levenshteinDistance(userAliasNorm, entryNorm);
        const alMaxLen = Math.max(userAliasNorm.length, entryNorm.length);
        if (alMaxLen > 0 && (1 - alDist / alMaxLen) >= 0.8) {
          confidence = Math.max(confidence, 70);
          matchType = 'alias';
        }
      }
    }

    if (confidence >= 50) {
      matches.push({
        entryId: entry.entryId,
        fullName: entry.fullName,
        listSource: entry.listSource as SanctionsMatchResult['matches'][0]['listSource'],
        matchType,
        confidence,
        nationality: entry.nationality,
        dateOfBirth: entry.dateOfBirth,
      });
    }
  }

  const matched = matches.length > 0;
  const result = matches.some((m) => m.confidence >= 90) ? 'confirmed_match' : matched ? 'potential_match' : 'clear';

  if (matched) {
    await logComplianceEvent({
      actorType: 'system',
      action: 'sanctions_match_found',
      category: 'sanctions',
      description: `Sanctions check for "${name}": ${matches.length} match(es)`,
      metadata: { name, matchCount: matches.length, result },
    });
  }

  return { matched, result, matches };
}

export async function updateSanctionsList(source: string): Promise<{ added: number; updated: number; removed: number }> {
  log.info({ source }, 'Sanctions list update requested');
  // In mock/development mode, this is a no-op placeholder
  // Real implementation would download OFAC SDN XML, EU consolidated, etc.
  return { added: 0, updated: 0, removed: 0 };
}
