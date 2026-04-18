import { Money } from '../value-objects/money';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { UserId } from '../value-objects/user-id';
import { Transaction } from '../entities/transaction';

export class TransactionFactory {
  static create(
    userId: string,
    subscriptionId: string,
    planId: string,
    baseAmount: number,
    discountAmount: number,
    finalAmount: number,
    transactionRef: string,
    paymentMethod: string,
    paymentMetadata: Record<string, unknown> = {},
  ): Transaction {
    return Transaction.create(
      new UserId(userId),
      new SubscriptionId(subscriptionId),
      new PlanId(planId),
      new Money(baseAmount),
      new Money(discountAmount),
      new Money(finalAmount),
      transactionRef,
      paymentMethod,
      paymentMetadata,
    );
  }
}
