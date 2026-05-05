import { UserId } from '@20206205tech/nestjs-common';
import { Transaction } from '../../../domain/entities/transaction';
import { Money } from '../../../domain/value-objects/money';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { TransactionId } from '../../../domain/value-objects/transaction-id';
import { TransactionEntity } from '../entities/transaction.entity';

export class TransactionMapper {
  static toDomain(orm: TransactionEntity): Transaction {
    return Transaction.reconstitute({
      id: new TransactionId(orm.id),
      userId: new UserId(orm.userId),
      subscriptionId: new SubscriptionId(orm.subscriptionId),
      planId: new PlanId(orm.planId),
      baseAmount: new Money(Number(orm.baseAmount)),
      discountAmount: new Money(Number(orm.discountAmount)),
      finalAmount: new Money(Number(orm.finalAmount)),
      transactionRef: orm.transactionRef,
      paymentMethod: orm.paymentMethod,
      paymentStatus: orm.paymentStatus,
      providerTransactionId: orm.providerTransactionId,
      paymentMetadata: orm.paymentMetadata as Record<string, unknown>,
      paidAt: orm.paidAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      version: orm.version,
    });
  }

  static toOrm(domain: Transaction): TransactionEntity {
    const orm = new TransactionEntity();
    orm.id = domain.transactionId.value;
    orm.userId = domain.userId.value;
    orm.subscriptionId = domain.subscriptionId.value;
    orm.planId = domain.planId.value;
    orm.baseAmount = domain.baseAmount.amount;
    orm.discountAmount = domain.discountAmount.amount;
    orm.finalAmount = domain.finalAmount.amount;
    orm.transactionRef = domain.transactionRef;
    orm.paymentMethod = domain.paymentMethod;
    orm.paymentStatus = domain.paymentStatus;
    orm.providerTransactionId = domain.providerTransactionId;
    orm.paymentMetadata = domain.paymentMetadata;
    orm.paidAt = domain.paidAt;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.version = domain.version.value;
    return orm;
  }
}
