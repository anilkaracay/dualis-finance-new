import { describe, it, expect } from 'vitest';
import { AppError, getStatusForCode } from '../errorHandler';

describe('AppError', () => {
  it('creates error with correct properties', () => {
    const err = new AppError('VALIDATION_ERROR', 'Invalid input', 400, { field: 'name' });
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ field: 'name' });
    expect(err.name).toBe('AppError');
  });
  it('extends Error', () => {
    const err = new AppError('INTERNAL_ERROR', 'Something broke', 500);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('getStatusForCode', () => {
  it('maps UNAUTHORIZED to 401', () => { expect(getStatusForCode('UNAUTHORIZED')).toBe(401); });
  it('maps NOT_FOUND to 404', () => { expect(getStatusForCode('NOT_FOUND')).toBe(404); });
  it('maps RATE_LIMITED to 429', () => { expect(getStatusForCode('RATE_LIMITED')).toBe(429); });
  it('returns 500 for unknown codes', () => { expect(getStatusForCode('UNKNOWN_CODE')).toBe(500); });
});
