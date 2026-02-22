import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import { AppError } from './errorHandler.js';

// ---------------------------------------------------------------------------
// Validation result type
// ---------------------------------------------------------------------------

interface ValidationResult<T> {
  data: T;
}

// ---------------------------------------------------------------------------
// Validate request body
// ---------------------------------------------------------------------------

/**
 * Validates the request body against a Zod schema.
 * Returns the parsed data on success, throws an AppError on failure.
 */
export function validateBody<T extends z.ZodType>(
  schema: T,
  request: FastifyRequest,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(request.body);
  if (!result.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid request body',
      400,
      result.error.flatten().fieldErrors,
    );
  }
  return { data: result.data as z.infer<T> };
}

// ---------------------------------------------------------------------------
// Validate query parameters
// ---------------------------------------------------------------------------

/**
 * Validates request query parameters against a Zod schema.
 * Returns the parsed data on success, throws an AppError on failure.
 */
export function validateQuery<T extends z.ZodType>(
  schema: T,
  request: FastifyRequest,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(request.query);
  if (!result.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid query parameters',
      400,
      result.error.flatten().fieldErrors,
    );
  }
  return { data: result.data as z.infer<T> };
}

// ---------------------------------------------------------------------------
// Validate route params
// ---------------------------------------------------------------------------

/**
 * Validates route path parameters against a Zod schema.
 * Returns the parsed data on success, throws an AppError on failure.
 */
export function validateParams<T extends z.ZodType>(
  schema: T,
  request: FastifyRequest,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(request.params);
  if (!result.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid route parameters',
      400,
      result.error.flatten().fieldErrors,
    );
  }
  return { data: result.data as z.infer<T> };
}

// ---------------------------------------------------------------------------
// Fastify preHandler factory
// ---------------------------------------------------------------------------

/**
 * Creates a Fastify preHandler hook that validates the request body
 * against the given Zod schema, attaching parsed data to `request.body`.
 */
export function bodyValidator<T extends z.ZodType>(zodSchema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const result = zodSchema.safeParse(request.body);
    if (!result.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid request body',
        400,
        result.error.flatten().fieldErrors,
      );
    }
    // Replace body with the validated & coerced version
    (request.body as z.infer<T>) = result.data as z.infer<T>;
  };
}

/**
 * Creates a Fastify preHandler hook that validates query parameters.
 */
export function queryValidator<T extends z.ZodType>(zodSchema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const result = zodSchema.safeParse(request.query);
    if (!result.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        result.error.flatten().fieldErrors,
      );
    }
    (request.query as z.infer<T>) = result.data as z.infer<T>;
  };
}

/**
 * Creates a Fastify preHandler hook that validates route parameters.
 */
export function paramsValidator<T extends z.ZodType>(zodSchema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const result = zodSchema.safeParse(request.params);
    if (!result.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid route parameters',
        400,
        result.error.flatten().fieldErrors,
      );
    }
    (request.params as z.infer<T>) = result.data as z.infer<T>;
  };
}
