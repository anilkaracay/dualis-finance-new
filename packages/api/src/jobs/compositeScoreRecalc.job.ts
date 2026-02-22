import { createChildLogger } from '../config/logger.js';
import { registerJob } from './scheduler.js';
import * as compositeCreditService from '../services/compositeCredit.service.js';

const log = createChildLogger('composite-score-recalc');

/** Run nightly — recalculate composite scores for all known users. */
const INTERVAL_MS = 24 * 60 * 60 * 1_000; // 24 hours

const KNOWN_PARTIES = [
  'party::alice::1',
  'party::bob::2',
  'party::carol::3',
  'party::dave::4',
  'party::eve::5',
];

async function compositeScoreRecalcHandler(): Promise<void> {
  log.info({ partyCount: KNOWN_PARTIES.length }, 'Starting nightly composite score recalculation');

  for (const partyId of KNOWN_PARTIES) {
    try {
      compositeCreditService.calculateCompositeScore(partyId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ err: message, partyId }, 'Failed to recalculate composite score');
    }
  }

  log.debug('Composite score recalculation complete');
}

registerJob('composite-score-recalc', INTERVAL_MS, compositeScoreRecalcHandler);
