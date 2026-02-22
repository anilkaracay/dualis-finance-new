// ============================================================================
// PartyLayer Provider — Singleton Accessor
// ============================================================================

import { createPartyLayerProvider, type IPartyLayerProvider } from './partylayer-provider.js';
import { cantonConfig } from '../config/canton-env.js';

let _provider: IPartyLayerProvider | null = null;

/**
 * Get the PartyLayer provider singleton.
 * Selects mock or Canton implementation based on CANTON_MOCK config.
 */
export function getPartyLayerProvider(): IPartyLayerProvider {
  if (!_provider) {
    const config = cantonConfig();
    _provider = createPartyLayerProvider({
      mode: config.useMockData ? 'mock' : 'canton-sdk',
      cantonJsonApiUrl: config.jsonApiUrl,
      environment: config.environment,
    });
  }
  return _provider;
}

/** Reset provider (for testing). */
export function resetPartyLayerProvider(): void {
  _provider = null;
}
