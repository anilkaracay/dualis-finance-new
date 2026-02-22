import { describe, it, expect, beforeEach } from 'vitest';
import { getCantonConfig, resetCantonConfig } from '../canton-env.js';

describe('Canton Environment Config', () => {
  beforeEach(() => {
    // Clean up env vars
    delete process.env.CANTON_ENV;
    delete process.env.CANTON_MOCK;
    delete process.env.CANTON_OPERATOR_PARTY;
    delete process.env.CANTON_ORACLE_PARTY;
    delete process.env.CANTON_JSON_API_URL;
    delete process.env.CANTON_GRPC_URL;
    delete process.env.CANTON_JWT_TOKEN;
    delete process.env.CANTON_TLS_CERT_PATH;
    delete process.env.CANTON_LIQUIDATOR_PARTY;
    delete process.env.CANTON_TREASURY_PARTY;
    resetCantonConfig();
  });

  describe('sandbox (default)', () => {
    it('returns sandbox config when CANTON_ENV is unset', () => {
      const config = getCantonConfig();
      expect(config.environment).toBe('sandbox');
      expect(config.useMockData).toBe(true);
      expect(config.requireAuth).toBe(false);
      expect(config.useTls).toBe(false);
      expect(config.tokenBridgeMode).toBe('mock');
      expect(config.maxRetries).toBe(3);
      expect(config.waitForCommit).toBe(false);
    });

    it('has default sandbox parties', () => {
      const config = getCantonConfig();
      expect(config.parties.operator).toBe('Operator');
      expect(config.parties.oracle).toBe('Oracle');
      expect(config.parties.liquidator).toBe('Liquidator');
    });

    it('has default sandbox URLs', () => {
      const config = getCantonConfig();
      expect(config.jsonApiUrl).toBe('http://localhost:7575');
      expect(config.grpcUrl).toBe('localhost:6865');
    });
  });

  describe('devnet', () => {
    it('returns devnet config', () => {
      process.env.CANTON_ENV = 'devnet';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.environment).toBe('devnet');
      expect(config.useMockData).toBe(false);
      expect(config.requireAuth).toBe(true);
      expect(config.useTls).toBe(true);
      expect(config.tokenBridgeMode).toBe('cip56');
      expect(config.maxRetries).toBe(5);
      expect(config.waitForCommit).toBe(true);
    });

    it('has higher command timeout', () => {
      process.env.CANTON_ENV = 'devnet';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.commandTimeoutMs).toBe(60_000);
    });
  });

  describe('mainnet', () => {
    it('returns mainnet config', () => {
      process.env.CANTON_ENV = 'mainnet';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.environment).toBe('mainnet');
      expect(config.useMockData).toBe(false);
      expect(config.requireAuth).toBe(true);
      expect(config.useTls).toBe(true);
      expect(config.tokenBridgeMode).toBe('cip56');
      expect(config.commandTimeoutMs).toBe(90_000);
      expect(config.retryBaseDelayMs).toBe(1000);
    });
  });

  describe('env-var overrides', () => {
    it('overrides mock data via CANTON_MOCK', () => {
      process.env.CANTON_ENV = 'sandbox';
      process.env.CANTON_MOCK = 'false';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.useMockData).toBe(false);
    });

    it('overrides party identifiers', () => {
      process.env.CANTON_OPERATOR_PARTY = 'party::custom-op';
      process.env.CANTON_ORACLE_PARTY = 'party::custom-oracle';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.parties.operator).toBe('party::custom-op');
      expect(config.parties.oracle).toBe('party::custom-oracle');
    });

    it('overrides JSON API URL', () => {
      process.env.CANTON_JSON_API_URL = 'http://custom-host:9999';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.jsonApiUrl).toBe('http://custom-host:9999');
    });

    it('overrides gRPC URL', () => {
      process.env.CANTON_GRPC_URL = 'custom-grpc:10000';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.grpcUrl).toBe('custom-grpc:10000');
    });

    it('sets JWT token when provided', () => {
      process.env.CANTON_JWT_TOKEN = 'my-jwt-token';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.jwtToken).toBe('my-jwt-token');
    });

    it('sets TLS cert path when provided', () => {
      process.env.CANTON_TLS_CERT_PATH = '/path/to/cert.pem';
      resetCantonConfig();
      const config = getCantonConfig();
      expect(config.tlsCertPath).toBe('/path/to/cert.pem');
    });
  });

  describe('DAR version', () => {
    it('all environments have darVersion 2.0.0', () => {
      for (const envName of ['sandbox', 'devnet', 'mainnet'] as const) {
        process.env.CANTON_ENV = envName;
        resetCantonConfig();
        const config = getCantonConfig();
        expect(config.darVersion).toBe('2.0.0');
      }
    });
  });
});
