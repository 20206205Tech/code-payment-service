import { UserId } from '@20206205tech/nestjs-common';
import { Transaction } from '../../../domain/entities/transaction';
import { TransactionId } from '../../../domain/value-objects/transaction-id';

export const TRANSACTION_REPOSITORY_PORT = Symbol(
  'TRANSACTION_REPOSITORY_PORT',
);

export interface TransactionRepositoryPort {
  findById(id: TransactionId): Promise<Transaction | null>;
  findByTxnRef(txnRef: string): Promise<Transaction | null>;
  findBySubscriptionId(subscriptionId: string): Promise<Transaction | null>;
  findAllByUserId(
    userId: UserId,
    skip?: number,
    limit?: number,
  ): Promise<Transaction[]>;
  countAllByUserId(userId: UserId): Promise<number>;
  findPendingExpired(timeoutDate: Date): Promise<Transaction[]>;
  save(transaction: Transaction, context?: any): Promise<void>;
  delete(id: TransactionId): Promise<void>;
}
