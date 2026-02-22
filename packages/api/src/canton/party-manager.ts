/**
 * Party Manager — handles party allocation and verification across environments.
 *
 * Sandbox:  Allocates parties dynamically via JSON API
 * Devnet:   Verifies pre-allocated parties exist on the ledger
 * Mainnet:  Same as devnet with stricter validation
 */

import axios from 'axios';
import { createChildLogger } from '../config/logger.js';
import type { CantonConfig, PartyConfig } from '../config/canton-env.js';

const log = createChildLogger('party-manager');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PartyInfo {
  identifier: string;
  displayName: string;
  isLocal: boolean;
}

export interface PartyVerificationResult {
  allFound: boolean;
  found: string[];
  missing: string[];
}

// ---------------------------------------------------------------------------
// PartyManager
// ---------------------------------------------------------------------------

export class PartyManager {
  private readonly config: CantonConfig;
  private readonly knownParties = new Map<string, PartyInfo>();

  constructor(config: CantonConfig) {
    this.config = config;
    log.info({ env: config.environment }, 'PartyManager initialized');
  }

  /**
   * Ensure all required parties exist on the ledger.
   *
   * In sandbox mode, this allocates any missing parties.
   * In devnet/mainnet mode, this verifies they already exist.
   */
  async ensureParties(): Promise<PartyVerificationResult> {
    const required = this.getRequiredParties();
    log.info({ required, env: this.config.environment }, 'Ensuring parties');

    if (this.config.environment === 'sandbox') {
      return this.allocateParties(required);
    }
    return this.verifyParties(required);
  }

  /**
   * Get all required party identifiers from config.
   */
  private getRequiredParties(): string[] {
    const parties: PartyConfig = this.config.parties;
    const unique = new Set<string>([
      parties.operator,
      parties.oracle,
      parties.liquidator,
      parties.treasury,
    ]);
    return Array.from(unique);
  }

  /**
   * Sandbox: allocate parties via JSON API.
   */
  private async allocateParties(partyIds: string[]): Promise<PartyVerificationResult> {
    const found: string[] = [];
    const missing: string[] = [];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    for (const partyId of partyIds) {
      try {
        const response = await axios.post(
          `${this.config.jsonApiUrl}/v2/parties/allocate`,
          {
            identifierHint: partyId,
            displayName: partyId,
          },
          { headers, timeout: 10_000 },
        );

        const identifier = response.data?.identifier ?? partyId;
        this.knownParties.set(partyId, {
          identifier,
          displayName: partyId,
          isLocal: true,
        });
        found.push(partyId);
        log.info({ partyId, identifier }, 'Party allocated');
      } catch (error) {
        // Party may already exist — try to verify
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          found.push(partyId);
          this.knownParties.set(partyId, {
            identifier: partyId,
            displayName: partyId,
            isLocal: true,
          });
          log.debug({ partyId }, 'Party already exists');
        } else {
          missing.push(partyId);
          log.warn({ partyId, error: error instanceof Error ? error.message : 'Unknown' }, 'Party allocation failed');
        }
      }
    }

    return { allFound: missing.length === 0, found, missing };
  }

  /**
   * Devnet/Mainnet: verify parties exist via JSON API.
   */
  private async verifyParties(partyIds: string[]): Promise<PartyVerificationResult> {
    const found: string[] = [];
    const missing: string[] = [];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.jwtToken}`;
    }

    try {
      const response = await axios.get<{ result: Array<{ identifier: string; displayName: string; isLocal: boolean }> }>(
        `${this.config.jsonApiUrl}/v2/parties`,
        { headers, timeout: 10_000 },
      );

      const ledgerParties = new Set(
        (response.data.result ?? []).map((p) => p.identifier),
      );

      for (const partyId of partyIds) {
        if (ledgerParties.has(partyId)) {
          found.push(partyId);
          const info = (response.data.result ?? []).find((p) => p.identifier === partyId);
          this.knownParties.set(partyId, {
            identifier: partyId,
            displayName: info?.displayName ?? partyId,
            isLocal: info?.isLocal ?? false,
          });
        } else {
          missing.push(partyId);
        }
      }
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : 'Unknown' }, 'Failed to fetch parties from ledger');
      // In devnet/mainnet, treat all as missing if we can't verify
      missing.push(...partyIds);
    }

    if (missing.length > 0) {
      log.error(
        { missing, env: this.config.environment },
        'Required parties not found on ledger. Allocate them via Canton Console.',
      );
    } else {
      log.info({ found }, 'All required parties verified');
    }

    return { allFound: missing.length === 0, found, missing };
  }

  /**
   * Resolve a logical role to a party identifier.
   */
  resolveParty(role: keyof PartyConfig): string {
    return this.config.parties[role];
  }

  /**
   * Get info for a previously verified party.
   */
  getPartyInfo(partyId: string): PartyInfo | undefined {
    return this.knownParties.get(partyId);
  }

  /**
   * List all known/verified parties.
   */
  listKnownParties(): PartyInfo[] {
    return Array.from(this.knownParties.values());
  }
}
