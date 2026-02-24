import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import {
  listUsers, getUserById, changeUserRole, suspendUser,
  unsuspendUser, blacklistUser, getUserPositions,
  getUserTransactions, getUserDocuments, updateDocumentStatus,
} from '../admin-user.service';

describe('Admin User Service', () => {
  describe('listUsers', () => {
    it('returns all 10 mock users', () => {
      const result = listUsers();
      expect(result.total).toBe(10);
    });
    it('filters by status', () => {
      const result = listUsers({ status: 'suspended' });
      result.data.forEach((u: any) => expect(u.accountStatus).toBe('suspended'));
    });
    it('filters by role', () => {
      const result = listUsers({ role: 'admin' });
      result.data.forEach((u: any) => expect(u.role).toBe('admin'));
    });
    it('filters by search (name)', () => {
      const result = listUsers({ search: 'Alice' });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].displayName).toContain('Alice');
    });
    it('paginates', () => {
      const result = listUsers(undefined, { page: 1, limit: 3 });
      expect(result.data.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getUserById', () => {
    it('returns user for valid userId', () => {
      const user = getUserById('usr-001');
      expect(user).not.toBeNull();
      expect(user!.userId).toBe('usr-001');
    });
    it('returns null for invalid userId', () => {
      expect(getUserById('nonexistent')).toBeNull();
    });
  });

  describe('changeUserRole', () => {
    it('changes role and returns old/new', () => {
      const result = changeUserRole('usr-001', 'institutional');
      expect(result).not.toBeNull();
      expect(result!.oldRole).toBeDefined();
      expect(result!.newRole).toBe('institutional');
      changeUserRole('usr-001', 'retail');
    });
    it('returns null for non-existent user', () => {
      expect(changeUserRole('fake', 'admin')).toBeNull();
    });
  });

  describe('suspendUser / unsuspendUser / blacklistUser', () => {
    it('suspend changes status', () => {
      const user = suspendUser('usr-005', 'test reason');
      expect(user).not.toBeNull();
      expect(user!.accountStatus).toBe('suspended');
      unsuspendUser('usr-005');
    });
    it('unsuspend changes status to active', () => {
      suspendUser('usr-005', 'test');
      const user = unsuspendUser('usr-005');
      expect(user).not.toBeNull();
      expect(user!.accountStatus).toBe('active');
    });
    it('blacklist changes status', () => {
      const user = blacklistUser('usr-005', 'test');
      expect(user).not.toBeNull();
      expect(user!.accountStatus).toBe('blacklisted');
      unsuspendUser('usr-005');
    });
    it('returns null for non-existent user', () => {
      expect(suspendUser('fake', 'reason')).toBeNull();
    });
  });

  describe('getUserPositions / getUserTransactions / getUserDocuments', () => {
    it('returns positions', () => {
      const result = getUserPositions('usr-001');
      expect(result.data.length).toBeGreaterThan(0);
    });
    it('returns transactions', () => {
      const result = getUserTransactions('usr-001');
      expect(result.data.length).toBeGreaterThan(0);
    });
    it('returns documents', () => {
      const docs = getUserDocuments('usr-001');
      expect(docs.length).toBeGreaterThan(0);
    });
  });

  describe('updateDocumentStatus', () => {
    it('updates document status', () => {
      const docs = getUserDocuments('usr-001');
      const docId = docs[0].docId;
      const result = updateDocumentStatus('usr-001', docId, 'rejected', 'admin-001');
      expect(result).not.toBeNull();
      expect(result!.newStatus).toBe('rejected');
    });
    it('returns null for non-existent document', () => {
      expect(updateDocumentStatus('usr-001', 'fake-doc', 'approved', 'admin')).toBeNull();
    });
  });
});
