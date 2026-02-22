import { describe, it, expect } from 'vitest';
import { MockPartyLayerProvider, createPartyLayerProvider } from '../partylayer-provider';

describe('MockPartyLayerProvider', () => {
  const provider = new MockPartyLayerProvider();

  it('verifyWalletSignature always returns true in mock mode', async () => {
    const result = await provider.verifyWalletSignature('0x1234', 'message', 'signature');
    expect(result).toBe(true);
  });

  it('allocateParty returns a party ID with correct prefix', async () => {
    const { partyId } = await provider.allocateParty('user123', 'Test User');
    expect(partyId).toMatch(/^party::user_/);
    expect(partyId.length).toBeGreaterThan(15);
  });

  it('resolvePartyForWallet returns null for unknown wallet', async () => {
    const result = await provider.resolvePartyForWallet('0xunknown');
    expect(result).toBeNull();
  });

  it('submitCommand returns transaction and command IDs', async () => {
    const result = await provider.submitCommand({
      actAs: 'party::test',
      templateId: 'Dualis.Test:Template',
      choice: 'Execute',
      argument: { value: 100 },
    });

    expect(result.transactionId).toMatch(/^tx_/);
    expect(result.commandId).toMatch(/^cmd_/);
  });

  it('prepareSigningPayload returns hex payload with expiration', async () => {
    const result = await provider.prepareSigningPayload({
      actAs: 'party::test',
      templateId: 'Dualis.Test:Template',
      choice: 'Sign',
      argument: { amount: 500 },
    });

    expect(result.payload).toBeDefined();
    expect(typeof result.payload).toBe('string');
    expect(result.payload.length).toBeGreaterThan(0);
    expect(result.expiresAt).toBeDefined();
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('submitSignedPayload returns a transaction ID', async () => {
    const result = await provider.submitSignedPayload('deadbeef', 'sig123');
    expect(result.transactionId).toMatch(/^tx_/);
  });

  it('isHealthy returns true in mock mode', async () => {
    const healthy = await provider.isHealthy();
    expect(healthy).toBe(true);
  });
});

describe('createPartyLayerProvider', () => {
  it('creates MockPartyLayerProvider when mode is mock', () => {
    const provider = createPartyLayerProvider({
      mode: 'mock',
      cantonJsonApiUrl: 'http://localhost:7575',
      environment: 'sandbox',
    });
    expect(provider).toBeInstanceOf(MockPartyLayerProvider);
  });

  it('creates CantonPartyLayerProvider when mode is canton-sdk', () => {
    const provider = createPartyLayerProvider({
      mode: 'canton-sdk',
      cantonJsonApiUrl: 'http://localhost:7575',
      environment: 'sandbox',
    });
    // Should NOT be an instance of Mock
    expect(provider).not.toBeInstanceOf(MockPartyLayerProvider);
  });
});
