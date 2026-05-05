import { Inject } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';
import { BaseQueryHandler, UserId } from '@20206205tech/nestjs-common';

import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import { GetTransactionHistoryQuery } from './get-transaction-history.query';

export interface TransactionHistoryItem {
  id: string;
  plan_id: string;
  base_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: string;
  payment_method: string | null;
  paid_at: Date | null;
  created_at: Date;
}

@QueryHandler(GetTransactionHistoryQuery)
export class GetTransactionHistoryQueryHandler extends BaseQueryHandler<
  GetTransactionHistoryQuery,
  TransactionHistoryItem[]
> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {
    super();
  }

  async execute(
    query: GetTransactionHistoryQuery,
  ): Promise<TransactionHistoryItem[]> {
    const userId = new UserId(query.userId);
    const transactions = await this.transactionRepository.findAllByUserId(
      userId,
      query.skip,
      query.limit,
    );
    return transactions.map((txn) => ({
      id: txn.transactionId.value,
      plan_id: txn.planId.value,
      base_amount: txn.baseAmount.amount,
      discount_amount: txn.discountAmount.amount,
      final_amount: txn.finalAmount.amount,
      payment_status: txn.paymentStatus,
      payment_method: txn.paymentMethod,
      paid_at: txn.paidAt,
      created_at: txn.createdAt,
    }));
  }
}
