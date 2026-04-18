import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PAYMENT_QUEUE, PAYMENT_TIMEOUT_JOB } from '../../constants';
import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../ports/database/subscription.repository.port';
import { TransactionId } from '../../domain/value-objects/transaction-id';

interface PaymentTimeoutJobData {
  transactionId: string;
}

@Processor(PAYMENT_QUEUE)
export class PaymentTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentTimeoutProcessor.name);

  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {
    super();
  }

  async process(job: Job<PaymentTimeoutJobData, any, string>): Promise<void> {
    if (job.name !== PAYMENT_TIMEOUT_JOB) {
      return;
    }

    const { transactionId } = job.data;
    this.logger.log(
      `Processing payment timeout for transaction: ${transactionId}`,
    );

    const transaction = await this.transactionRepository.findById(
      new TransactionId(transactionId),
    );

    if (!transaction) {
      this.logger.warn(`Transaction not found: ${transactionId}`);
      return;
    }

    if (!transaction.isPending()) {
      this.logger.log(
        `Transaction ${transactionId} is already in state: ${transaction.paymentStatus}. Skipping expiration.`,
      );
      return;
    }

    // Mark transaction as expired
    transaction.markExpired();
    await this.transactionRepository.save(transaction);

    // Also mark associated subscription as expired (or delete if it was just pending)
    const subscription = await this.subscriptionRepository.findById(
      transaction.subscriptionId,
    );

    if (subscription && subscription.status === 'pending') {
      subscription.expire();
      await this.subscriptionRepository.save(subscription);
      this.logger.log(
        `Subscription ${subscription.subscriptionId.value} marked as expired.`,
      );
    }

    this.logger.log(
      `Transaction ${transactionId} has been marked as expired due to timeout.`,
    );
  }
}
