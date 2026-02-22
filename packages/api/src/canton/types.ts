/**
 * Canton-specific types for interacting with the Canton JSON API v2.
 * These are internal API types — shared Canton contract types are in @dualis/shared.
 */

/** Wrapper for a Canton ledger contract with metadata */
export interface CantonContract<T> {
  contractId: string;
  templateId: string;
  payload: T;
  key?: unknown;
  signatories: string[];
  observers: string[];
}

/** Result from exercising a choice on a contract */
export interface ExerciseResult {
  exerciseResult: unknown;
  events: unknown[];
}

/** Result from creating a new contract */
export interface CreateResult {
  contractId: string;
  templateId: string;
}

/** Command to send to the Canton JSON API */
export interface CantonCommand {
  templateId: string;
  choice: string;
  argument: Record<string, unknown>;
  contractId?: string;
}

/** Query filter for fetching contracts from the Canton JSON API */
export interface CantonQueryFilter {
  templateId: string;
  query?: Record<string, unknown>;
}
