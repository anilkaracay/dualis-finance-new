// ---------------------------------------------------------------------------
// Mock user data
// ---------------------------------------------------------------------------

interface UserDetail {
  userId: string;
  displayName: string;
  email: string;
  walletAddress: string;
  role: string;
  accountStatus: string;
  kybStatus: string | null;
  creditTier: string;
  totalSupplied: number;
  totalBorrowed: number;
  healthFactor: number | null;
  createdAt: string;
}

const MOCK_USERS: UserDetail[] = [
  { userId: 'usr-001', displayName: 'Alice Johnson', email: 'alice@example.com', walletAddress: '0xAlice...abc1', role: 'retail', accountStatus: 'active', kybStatus: null, creditTier: 'Gold', totalSupplied: 500_000, totalBorrowed: 100_000, healthFactor: 2.45, createdAt: '2024-06-01' },
  { userId: 'usr-002', displayName: 'Bob Smith', email: 'bob@example.com', walletAddress: '0xBob...def2', role: 'retail', accountStatus: 'active', kybStatus: null, creditTier: 'Silver', totalSupplied: 250_000, totalBorrowed: 150_000, healthFactor: 1.35, createdAt: '2024-06-15' },
  { userId: 'usr-003', displayName: 'Carol Chen', email: 'carol@example.com', walletAddress: '0xCarol...ghi3', role: 'institutional', accountStatus: 'active', kybStatus: 'Verified', creditTier: 'Diamond', totalSupplied: 2_000_000, totalBorrowed: 800_000, healthFactor: 1.85, createdAt: '2024-07-01' },
  { userId: 'usr-004', displayName: 'Dave Williams', email: 'dave@example.com', walletAddress: '0xDave...jkl4', role: 'retail', accountStatus: 'suspended', kybStatus: null, creditTier: 'Bronze', totalSupplied: 50_000, totalBorrowed: 40_000, healthFactor: 1.08, createdAt: '2024-08-01' },
  { userId: 'usr-005', displayName: 'Eve Martinez', email: 'eve@example.com', walletAddress: '0xEve...mno5', role: 'retail', accountStatus: 'active', kybStatus: null, creditTier: 'Gold', totalSupplied: 750_000, totalBorrowed: 200_000, healthFactor: 2.10, createdAt: '2024-08-15' },
  { userId: 'usr-006', displayName: 'Admin User', email: 'admin@dualis.finance', walletAddress: '0xAdmin...pqr6', role: 'admin', accountStatus: 'active', kybStatus: null, creditTier: 'Unrated', totalSupplied: 0, totalBorrowed: 0, healthFactor: null, createdAt: '2024-06-01' },
  { userId: 'usr-007', displayName: 'Compliance Officer', email: 'compliance@dualis.finance', walletAddress: '0xComp...stu7', role: 'compliance_officer', accountStatus: 'active', kybStatus: null, creditTier: 'Unrated', totalSupplied: 0, totalBorrowed: 0, healthFactor: null, createdAt: '2024-06-01' },
  { userId: 'usr-008', displayName: 'Frank Global Fund', email: 'frank@globalfund.com', walletAddress: '0xFrank...vwx8', role: 'institutional', accountStatus: 'active', kybStatus: 'Verified', creditTier: 'Diamond', totalSupplied: 5_000_000, totalBorrowed: 2_000_000, healthFactor: 1.95, createdAt: '2024-09-01' },
  { userId: 'usr-009', displayName: 'Grace Lee', email: 'grace@example.com', walletAddress: '0xGrace...yza9', role: 'retail', accountStatus: 'pending_verification', kybStatus: null, creditTier: 'Unrated', totalSupplied: 0, totalBorrowed: 0, healthFactor: null, createdAt: '2024-12-01' },
  { userId: 'usr-010', displayName: 'Blacklisted Corp', email: 'bl@example.com', walletAddress: '0xBlack...bcd0', role: 'institutional', accountStatus: 'blacklisted', kybStatus: 'Rejected', creditTier: 'Unrated', totalSupplied: 0, totalBorrowed: 0, healthFactor: null, createdAt: '2024-10-01' },
];

const MOCK_POSITIONS = [
  { id: 'pos-1', pool: 'usdc-main', type: 'supply', amount: 300_000, valueUSD: 300_000, apy: 0.032 },
  { id: 'pos-2', pool: 'eth-main', type: 'supply', amount: 50, valueUSD: 200_000, apy: 0.018 },
  { id: 'pos-3', pool: 'usdc-main', type: 'borrow', amount: 100_000, valueUSD: 100_000, apy: 0.058 },
];

const MOCK_TRANSACTIONS = [
  { id: 'tx-1', type: 'supply', pool: 'usdc-main', amount: 300_000, timestamp: '2024-12-01T10:00:00Z', txHash: '0xabc...123' },
  { id: 'tx-2', type: 'borrow', pool: 'usdc-main', amount: 100_000, timestamp: '2024-12-05T14:30:00Z', txHash: '0xdef...456' },
  { id: 'tx-3', type: 'supply', pool: 'eth-main', amount: 50, timestamp: '2024-12-10T09:00:00Z', txHash: '0xghi...789' },
];

const MOCK_DOCUMENTS = [
  { docId: 'doc-1', type: 'incorporation_cert', fileName: 'cert_of_inc.pdf', status: 'approved', uploadedAt: '2024-07-01T10:00:00Z', reviewedAt: '2024-07-02T14:00:00Z', reviewedBy: 'usr-007' },
  { docId: 'doc-2', type: 'beneficial_ownership', fileName: 'ubo_declaration.pdf', status: 'pending', uploadedAt: '2024-12-01T10:00:00Z', reviewedAt: null, reviewedBy: null },
  { docId: 'doc-3', type: 'financial_statement', fileName: 'annual_report_2024.pdf', status: 'approved', uploadedAt: '2024-08-15T10:00:00Z', reviewedAt: '2024-08-16T09:00:00Z', reviewedBy: 'usr-007' },
];

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export function listUsers(
  filters?: { status?: string; role?: string; search?: string },
  pagination?: { page: number; limit: number },
) {
  let users = [...MOCK_USERS];

  if (filters?.status) users = users.filter((u) => u.accountStatus === filters.status);
  if (filters?.role) users = users.filter((u) => u.role === filters.role);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.userId.toLowerCase().includes(s) ||
        u.walletAddress.toLowerCase().includes(s),
    );
  }

  const total = users.length;
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 20;
  const offset = (page - 1) * limit;

  return { data: users.slice(offset, offset + limit), total, page, limit };
}

export function getUserById(userId: string) {
  return MOCK_USERS.find((u) => u.userId === userId) ?? null;
}

export function changeUserRole(userId: string, newRole: string) {
  const user = MOCK_USERS.find((u) => u.userId === userId);
  if (!user) return null;
  const oldRole = user.role;
  (user as { role: string }).role = newRole;
  return { oldRole, newRole, user };
}

export function suspendUser(userId: string, _reason: string) {
  const user = MOCK_USERS.find((u) => u.userId === userId);
  if (!user) return null;
  user.accountStatus = 'suspended';
  return user;
}

export function unsuspendUser(userId: string) {
  const user = MOCK_USERS.find((u) => u.userId === userId);
  if (!user) return null;
  user.accountStatus = 'active';
  return user;
}

export function blacklistUser(userId: string, _reason: string) {
  const user = MOCK_USERS.find((u) => u.userId === userId);
  if (!user) return null;
  user.accountStatus = 'blacklisted';
  return user;
}

export function getUserPositions(_userId: string, pagination?: { page: number; limit: number }) {
  return { data: MOCK_POSITIONS, total: MOCK_POSITIONS.length, page: pagination?.page ?? 1, limit: pagination?.limit ?? 20 };
}

export function getUserTransactions(_userId: string, pagination?: { page: number; limit: number }) {
  return { data: MOCK_TRANSACTIONS, total: MOCK_TRANSACTIONS.length, page: pagination?.page ?? 1, limit: pagination?.limit ?? 20 };
}

export function getUserDocuments(_userId: string) {
  return MOCK_DOCUMENTS;
}

export function updateDocumentStatus(_userId: string, docId: string, status: string, reviewedBy: string) {
  const doc = MOCK_DOCUMENTS.find((d) => d.docId === docId);
  if (!doc) return null;
  const oldStatus = doc.status;
  doc.status = status;
  doc.reviewedAt = new Date().toISOString();
  doc.reviewedBy = reviewedBy;
  return { oldStatus, newStatus: status, doc };
}
