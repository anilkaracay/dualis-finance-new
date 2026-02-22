import { createChildLogger } from '../config/logger.js';
import type {
  FlashLoanRequest,
  FlashLoanResponse,
  TransactionMeta,
} from '@dualis/shared';
import { randomUUID } from 'node:crypto';

const log = createChildLogger('flash-loan-service');

function buildTransactionMeta(): TransactionMeta {
  return {
    id: `tx-${randomUUID()}`,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };
}

export function execute(
  partyId: string,
  params: FlashLoanRequest
): { data: FlashLoanResponse; transaction: TransactionMeta } {
  log.info(
    { partyId, poolId: params.poolId, amount: params.amount },
    'Executing flash loan'
  );

  const borrowed = parseFloat(params.amount);
  const feeRate = 0.0009; // 0.09%
  const fee = Number((borrowed * feeRate).toFixed(6));
  const returned = Number((borrowed + fee).toFixed(6));

  const operations = params.callbackData.operations.map((op) => ({
    type: op.type,
    status: 'success' as const,
  }));

  return {
    data: {
      borrowed,
      fee,
      returned,
      operations,
    },
    transaction: buildTransactionMeta(),
  };
}
