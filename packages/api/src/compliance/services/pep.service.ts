import { eq, and, ilike } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { sanctionsListEntries } from '../../db/schema.js';
import { normalizeName, levenshteinDistance } from './sanctions.service.js';
import { logComplianceEvent } from '../audit.js';
import type { PEPScreeningResult, PEPLevel } from '@dualis/shared';

const PEP_LEVEL_SCORES: Record<string, number> = {
  not_pep: 0,
  level3: 20,
  level2: 40,
  level1: 60,
};

interface PEPCheckOptions {
  nationality?: string;
  dateOfBirth?: string;
}

export async function checkPEP(name: string, options: PEPCheckOptions = {}): Promise<PEPScreeningResult> {
  const db = getDb();
  if (!db) return { isPEP: false, level: 'not_pep', score: 0, matches: [] };

  const normalized = normalizeName(name);

  const candidates = await db
    .select()
    .from(sanctionsListEntries)
    .where(and(eq(sanctionsListEntries.listSource, 'pep'), eq(sanctionsListEntries.isActive, true), ilike(sanctionsListEntries.normalizedName, `%${normalized.split(' ')[0] ?? ''}%`)))
    .limit(200);

  const matches: PEPScreeningResult['matches'] = [];

  for (const entry of candidates) {
    const entryNorm = normalizeName(entry.fullName);
    const dist = levenshteinDistance(normalized, entryNorm);
    const maxLen = Math.max(normalized.length, entryNorm.length);
    const similarity = maxLen > 0 ? 1 - dist / maxLen : 0;

    if (similarity < 0.7) continue;

    let confidence: number = similarity * 100;
    if (options.dateOfBirth && entry.dateOfBirth === options.dateOfBirth) {
      confidence = Math.min(confidence + 15, 100);
    }

    if (confidence >= 50) {
      // Determine PEP level from entry metadata
      const identifiers = entry.identifiers as Record<string, string> | null;
      const level = (identifiers?.pepLevel as PEPLevel) ?? 'level3';
      const position = identifiers?.position ?? 'Unknown';

      matches.push({
        entryId: entry.entryId,
        fullName: entry.fullName,
        position,
        level,
        confidence,
        nationality: entry.nationality,
        dateOfBirth: entry.dateOfBirth,
      });
    }
  }

  if (matches.length === 0) {
    return { isPEP: false, level: 'not_pep', score: 0, matches: [] };
  }

  // Determine highest PEP level
  const levelPriority: Record<string, number> = { level1: 3, level2: 2, level3: 1, not_pep: 0 };
  const sortedMatches = [...matches].sort((a: PEPScreeningResult['matches'][0], b: PEPScreeningResult['matches'][0]) =>
    (levelPriority[b.level] ?? 0) - (levelPriority[a.level] ?? 0),
  );

  const highestLevel = sortedMatches[0]!.level;
  const score: number = PEP_LEVEL_SCORES[highestLevel] ?? 0;

  await logComplianceEvent({
    actorType: 'system',
    action: 'pep_check_performed',
    category: 'pep',
    description: `PEP check for "${name}": ${matches.length} match(es), level: ${highestLevel}`,
    metadata: { name, matchCount: matches.length, level: highestLevel },
  });

  return { isPEP: true, level: highestLevel, score, matches };
}
