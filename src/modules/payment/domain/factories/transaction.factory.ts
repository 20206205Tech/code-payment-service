import { UserId } from '@20206205tech/nestjs-common';
import { Transaction } from '../entities/transaction';
import { Money } from '../value-objects/money';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';

export class TransactionFactory {
  static create(
    userId: UserId,
    subscriptionId: SubscriptionId,
    planId: PlanId,
    baseAmount: Money,
    discountAmount: Money,
    finalAmount: Money,
    transactionRef: string,
    paymentMethod: string,
    paymentMetadata: Record<string, unknown> = {},
  ): Transaction {
    return Transaction.create(
      userId,
      subscriptionId,
      planId,
      baseAmount,
      discountAmount,
      finalAmount,
      transactionRef,
      paymentMethod,
      paymentMetadata,
    );
  }
}
