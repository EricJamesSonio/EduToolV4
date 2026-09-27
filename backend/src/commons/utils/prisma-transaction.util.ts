// src/commons/utils/prisma-transaction.util.ts
//
// Phase 1 (perf/correctness): single consistent wrapper for all multi-step
// Prisma writes. Use this instead of ad-hoc `$transaction` calls so timeout
// and usage stay uniform across repositories/services.
//
// Works with `DatabaseService` (extends PrismaClient) or any `{ $transaction }`
// mock in unit tests.
import type { Prisma, PrismaClient } from '@prisma/client';

export type PrismaTxClient = Prisma.TransactionClient;

export interface RunInTxOptions {
  /** Interactive-transaction timeout in ms. Default 10_000. */
  timeout?: number;
}

export async function runInTx<T>(
  prisma: Pick<PrismaClient, '$transaction'>,
  fn: (tx: PrismaTxClient) => Promise<T>,
  options: RunInTxOptions = {},
): Promise<T> {
  const timeout = options.timeout ?? 10_000;
  return prisma.$transaction((tx) => fn(tx), { timeout });
}
