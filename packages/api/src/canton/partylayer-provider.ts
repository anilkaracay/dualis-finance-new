// ============================================================================
// PartyLayer SDK Abstraction — Interface + Mock + Canton Implementations
// ============================================================================
//
// Since @partylayer/sdk does not exist on npm, we define our own
// IPartyLayerProvider interface. The mock implementation is used when
// CANTON_MOCK=true; in production, CantonPartyLayerProvider delegates
// to CantonClient. This interface can later wrap @canton-network/dapp-sdk.
// ============================================================================

import { nanoid } from 'nanoid';
import { createChildLogger } from '../config/logger.js';
import { CantonClient } from './client.js';

const log = createChildLogger('partylayer');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface PartyLayerConfig {
  mode: 'mock' | 'canton-sdk';
  cantonJsonApiUrl: string;
  environment: 'sandbox' | 'devnet' | 'mainnet';
}

// ---------------------------------------------------------------------------
// Command Parameters
// ---------------------------------------------------------------------------

export interface CommandParams {
  actAs: string;
  templateId: string;
  choice: string;
  argument: Record<string, unknown>;
  contractId?: string;
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IPartyLayerProvider {
  /** Verify a wallet's cryptographic signature over a message. */
  verifyWalletSignature(
    walletAddress: string,
    message: string,
    signature: string,
  ): Promise<boolean>;

  /** Allocate a new Canton party for a user. */
  allocateParty(
    userId: string,
    displayName: string,
  ): Promise<{ partyId: string }>;

  /** Resolve the Canton party associated with a wallet address. */
  resolvePartyForWallet(walletAddress: string): Promise<string | null>;

  /** Submit a command (proxy mode — server signs). */
  submitCommand(params: CommandParams): Promise<{
    transactionId: string;
    commandId: string;
  }>;

  /** Prepare a signing payload for wallet-sign mode. */
  prepareSigningPayload(params: CommandParams): Promise<{
    payload: string;
    expiresAt: string;
  }>;

  /** Submit a pre-signed payload (wallet-sign mode). */
  submitSignedPayload(
    payload: string,
    signature: string,
  ): Promise<{ transactionId: string }>;

  /** Health check. */
  isHealthy(): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Mock Implementation
// ---------------------------------------------------------------------------

export class MockPartyLayerProvider implements IPartyLayerProvider {
  private readonly walletPartyMap = new Map<string, string>();

  async verifyWalletSignature(
    _walletAddress: string,
    _message: string,
    _signature: string,
  ): Promise<boolean> {
    // Mock: accept all signatures
    log.debug('Mock: wallet signature verified');
    return true;
  }

  async allocateParty(
    _userId: string,
    _displayName: string,
  ): Promise<{ partyId: string }> {
    const partyId = `party::user_${nanoid(12)}`;
    log.debug({ partyId }, 'Mock: party allocated');
    return { partyId };
  }

  async resolvePartyForWallet(walletAddress: string): Promise<string | null> {
    return this.walletPartyMap.get(walletAddress) ?? null;
  }

  async submitCommand(params: CommandParams): Promise<{
    transactionId: string;
    commandId: string;
  }> {
    const transactionId = `tx_${nanoid(16)}`;
    const commandId = `cmd_${nanoid(12)}`;
    log.debug(
      { transactionId, commandId, actAs: params.actAs, choice: params.choice },
      'Mock: command submitted',
    );
    return { transactionId, commandId };
  }

  async prepareSigningPayload(params: CommandParams): Promise<{
    payload: string;
    expiresAt: string;
  }> {
    const payload = Buffer.from(
      JSON.stringify({
        actAs: params.actAs,
        templateId: params.templateId,
        choice: params.choice,
        argument: params.argument,
        contractId: params.contractId,
        nonce: nanoid(16),
      }),
    ).toString('hex');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    log.debug({ actAs: params.actAs, choice: params.choice }, 'Mock: signing payload prepared');
    return { payload, expiresAt };
  }

  async submitSignedPayload(
    _payload: string,
    _signature: string,
  ): Promise<{ transactionId: string }> {
    const transactionId = `tx_${nanoid(16)}`;
    log.debug({ transactionId }, 'Mock: signed payload submitted');
    return { transactionId };
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Canton SDK Implementation
// ---------------------------------------------------------------------------

export class CantonPartyLayerProvider implements IPartyLayerProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(config: PartyLayerConfig) {
    // Config stored for future Canton SDK integration
    void config;
  }

  async verifyWalletSignature(
    _walletAddress: string,
    _message: string,
    _signature: string,
  ): Promise<boolean> {
    // TODO: Implement real CIP-0103 signature verification
    // For now, delegate to mock behavior until Canton wallet SDK is integrated.
    log.debug('Canton: wallet signature verification (stub — accepting)');
    return true;
  }

  async allocateParty(
    _userId: string,
    displayName: string,
  ): Promise<{ partyId: string }> {
    const canton = CantonClient.getInstance();
    try {
      const result = await canton.createContract(
        'Dualis.Party:PartyAllocation',
        { displayName },
      );
      const partyId = result.contractId ?? `party::user_${nanoid(12)}`;
      log.info({ partyId, displayName }, 'Canton: party allocated');
      return { partyId };
    } catch (err) {
      log.warn({ err }, 'Canton: party allocation failed, generating local ID');
      return { partyId: `party::user_${nanoid(12)}` };
    }
  }

  async resolvePartyForWallet(_walletAddress: string): Promise<string | null> {
    // TODO: Query Canton for party-to-wallet mapping contract
    return null;
  }

  async submitCommand(params: CommandParams): Promise<{
    transactionId: string;
    commandId: string;
  }> {
    const canton = CantonClient.getInstance();
    const contractId = params.contractId ?? '';

    const result = await canton.exerciseChoice(
      params.templateId,
      contractId,
      params.choice,
      params.argument,
    );

    // ExerciseResult has { exerciseResult, events } — extract a tx ID or generate one
    const exerciseData = result.exerciseResult as Record<string, unknown> | null;
    const txId = (exerciseData?.transactionId as string) ?? `tx_${nanoid(16)}`;

    return {
      transactionId: txId,
      commandId: `cmd_${nanoid(12)}`,
    };
  }

  async prepareSigningPayload(params: CommandParams): Promise<{
    payload: string;
    expiresAt: string;
  }> {
    // Build a canonical payload to be signed by the client wallet
    const payload = Buffer.from(
      JSON.stringify({
        actAs: params.actAs,
        templateId: params.templateId,
        choice: params.choice,
        argument: params.argument,
        contractId: params.contractId,
        nonce: nanoid(16),
        timestamp: Date.now(),
      }),
    ).toString('hex');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    return { payload, expiresAt };
  }

  async submitSignedPayload(
    _payload: string,
    _signature: string,
  ): Promise<{ transactionId: string }> {
    // TODO: Submit the signed payload through Canton's wallet gateway
    const transactionId = `tx_${nanoid(16)}`;
    log.info({ transactionId }, 'Canton: signed payload submitted (stub)');
    return { transactionId };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const canton = CantonClient.getInstance();
      const contracts = await canton.queryContracts('Dualis.System:Health');
      return contracts !== null;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPartyLayerProvider(
  config: PartyLayerConfig,
): IPartyLayerProvider {
  if (config.mode === 'mock') {
    log.info('Using MockPartyLayerProvider');
    return new MockPartyLayerProvider();
  }
  log.info({ env: config.environment }, 'Using CantonPartyLayerProvider');
  return new CantonPartyLayerProvider(config);
}
