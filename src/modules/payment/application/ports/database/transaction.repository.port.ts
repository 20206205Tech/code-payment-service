import { Transaction } from '../../../domain/entities/transaction';
import { TransactionId } from '../../../domain/value-objects/transaction-id';
import { UserId } from '../../../domain/value-objects/user-id';

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
  save(transaction: Transaction): Promise<void>;
  delete(id: TransactionId): Promise<void>;
}
