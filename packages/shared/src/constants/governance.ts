// ══════════════════════════════════════════════════════════════════════════════
// GOVERNANCE CONSTANTS (MP23)
// ══════════════════════════════════════════════════════════════════════════════

export const GOVERNANCE = {
  PROPOSAL_PREFIX: 'DIP',
  MIN_VOTE_WEIGHT: '0.01',
  MAX_DELEGATION_DEPTH: 1,
  MAX_ACTIVE_PROPOSALS: 10,
  TITLE_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 120,
  DESCRIPTION_MIN_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 10000,
  DISCUSSION_URL_REQUIRED: true,
  SNAPSHOT_DELAY_BLOCKS: 1,
  VETO_ENABLED: true,
  PARAMETER_COOLDOWN_DAYS: 14,
} as const;
