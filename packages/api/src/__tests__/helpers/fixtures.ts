export const SEED_POOL_IDS = [
  'usdc-main',
  'wbtc-main',
  'eth-main',
  'cc-main',
  'tbill-2026',
  'spy-2026',
] as const;

export const TEST_PARTY_IDS = {
  alice: 'party::alice::001',
  bob: 'party::bob::002',
  admin: 'party::admin::006',
  institutional: 'party::carol::003',
};

export const TEST_JWT_SECRET = 'test-jwt-secret-for-vitest-only-32chars!!';

export const TEST_USER_PAYLOAD = {
  sub: 'usr-test-001',
  partyId: TEST_PARTY_IDS.alice,
  role: 'retail',
  email: 'alice@test.com',
  jti: 'test-jti-001',
};

export const TEST_ADMIN_PAYLOAD = {
  sub: 'usr-admin-001',
  partyId: TEST_PARTY_IDS.admin,
  role: 'admin',
  email: 'admin@test.com',
  jti: 'test-jti-admin',
};

export const TEST_INSTITUTIONAL_PAYLOAD = {
  sub: 'usr-inst-001',
  partyId: TEST_PARTY_IDS.institutional,
  role: 'institutional',
  email: 'carol@institution.com',
  jti: 'test-jti-inst',
};

export const VALID_COLLATERAL_SETS = {
  ethOnly: [{ symbol: 'ETH', amount: '10' }],
  mixed: [
    { symbol: 'ETH', amount: '5' },
    { symbol: 'wBTC', amount: '0.5' },
  ],
  usdcOnly: [{ symbol: 'USDC', amount: '100000' }],
};

export const VALID_BORROW_REQUEST = {
  lendingPoolId: 'usdc-main',
  borrowAmount: '10000',
  collateralAssets: VALID_COLLATERAL_SETS.mixed,
};
