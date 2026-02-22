import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateBody, validateQuery } from '../validate';
import { AppError } from '../errorHandler';

// Type-safe mock for Fastify request
interface MockRequest {
  body: unknown;
  query: unknown;
  params: Record<string, unknown>;
}

function mockRequest(body?: unknown, query?: unknown): MockRequest {
  return { body, query, params: {} };
}

describe('validateBody', () => {
  const schema = z.object({ name: z.string(), age: z.number() });

  it('returns parsed data for valid body', () => {
    const req = mockRequest({ name: 'Alice', age: 30 });
    const result = validateBody(schema, req as unknown as Parameters<typeof validateBody>[1]);
    expect(result.data).toEqual({ name: 'Alice', age: 30 });
  });

  it('throws AppError for invalid body', () => {
    const req = mockRequest({ name: 123 });
    expect(() => validateBody(schema, req as unknown as Parameters<typeof validateBody>[1])).toThrow(AppError);
  });

  it('thrown error has VALIDATION_ERROR code', () => {
    const req = mockRequest({});
    try {
      validateBody(schema, req as unknown as Parameters<typeof validateBody>[1]);
    } catch (err) {
      expect((err as AppError).code).toBe('VALIDATION_ERROR');
      expect((err as AppError).statusCode).toBe(400);
    }
  });
});

describe('validateQuery', () => {
  const schema = z.object({ page: z.coerce.number().default(1) });

  it('returns parsed data for valid query', () => {
    const req = mockRequest(undefined, { page: '5' });
    const result = validateQuery(schema, req as unknown as Parameters<typeof validateQuery>[1]);
    expect(result.data.page).toBe(5);
  });

  it('applies defaults', () => {
    const req = mockRequest(undefined, {});
    const result = validateQuery(schema, req as unknown as Parameters<typeof validateQuery>[1]);
    expect(result.data.page).toBe(1);
  });
});
