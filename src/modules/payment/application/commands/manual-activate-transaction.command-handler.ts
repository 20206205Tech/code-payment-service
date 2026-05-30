import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@20206205tech/nestjs-common';

import { DataSource } from 'typeorm';
import { Transaction } from '../../domain/entities/transaction';
import { TransactionId } from '../../domain/value-objects/transaction-id';
import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';
import { TransactionAlreadyProcessedException } from '../../domain/exceptions/transaction-already-processed.exception';
import { TransactionNotFoundException } from '../../domain/exceptions/transaction-not-found.exception';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../ports/database/plan.repository.port';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../ports/database/subscription.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import { ManualActivateTransactionCommand } from './manual-activate-transaction.command';

@CommandHandler(ManualActivateTransactionCommand)
export class ManualActivateTransactionCommandHandler extends BaseCommandHandler<
  ManualActivateTransactionCommand,
  Transaction
> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
    private readonly dataSource: DataSource,
    private readonly publisher: EventPublisher,
    private readonly paymentDomainService: PaymentDomainService,
  ) {
    super();
  }

  async execute(
    command: ManualActivateTransactionCommand,
  ): Promise<Transaction> {
    const transactionId = new TransactionId(command.transactionId);
    const txn = await this.transactionRepository.findById(transactionId);
    if (!txn) throw new TransactionNotFoundException(command.transactionId);
    if (txn.isSuccess())
      throw new TransactionAlreadyProcessedException(command.transactionId);

    // Mark transaction as success (independent of subscription existence for manual activation)
    txn.markSuccess();
    txn.setPaidAt(new Date());
    txn.mergePaymentMetadata({ action: 'MANUAL_BY_ADMIN' });

    const [subscriptionData, plan] = await Promise.all([
      this.subscriptionRepository.findById(txn.subscriptionId),
      this.planRepository.findById(txn.planId),
    ]);

    if (!plan) {
      throw new PlanNotFoundException(txn.planId.value);
    }

    if (subscriptionData) {
      const subscription = subscriptionData;

      // Tìm gói đang active có hạn xa nhất để cộng dồn
      const latestActiveSub =
        await this.subscriptionRepository.findLatestActiveSubscription(
          txn.userId,
        );

      let baseDate = new Date();
      if (latestActiveSub && latestActiveSub.periodEnd > baseDate) {
        baseDate = latestActiveSub.periodEnd;
        this.logger.log(
          `Manual Stacking subscription for user ${txn.userId.value}. New periodStart: ${baseDate.toISOString()}`,
        );
      }

      // Use domain service to handle fulfillment logic
      this.paymentDomainService.fulfillPayment(
        txn,
        subscription,
        plan,
        baseDate,
      );

      await this.dataSource.transaction(async (manager) => {
        // Không gọi deactivateOtherSubscriptions nữa để cộng dồn
        await this.subscriptionRepository.save(subscription, manager);
        await this.transactionRepository.save(txn, manager);
      });

      subscription.commit();
    } else {
      // Still save transaction if no subscription
      await this.transactionRepository.save(txn);
    }

    return txn;
  }
}
