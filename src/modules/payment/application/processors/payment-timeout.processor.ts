import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  PAYMENT_QUEUE,
  PAYMENT_TIMEOUT_QUEUE,
} from '../../domain/value-objects/constants';
import { TransactionId } from '../../domain/value-objects/transaction-id';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../ports/database/subscription.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';

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
    private readonly paymentDomainService: PaymentDomainService,
  ) {
    super();
  }

  async process(job: Job<PaymentTimeoutJobData, any, string>): Promise<void> {
    if (job.name !== PAYMENT_TIMEOUT_QUEUE) {
      return;
    }

    const { transactionId } = job.data;
    this.logger.log(
      `Processing payment timeout for transaction: ${transactionId}`,
    );

    await this.handleExpiration(transactionId);
  }

  // @OnWorkerEvent('failed')
  // async onFailed(job: Job<PaymentTimeoutJobData>, error: Error) {
  //   this.logger.error(
  //     `Job ${job.id} for transaction ${job.data.transactionId} failed: ${error.message}`,
  //   );
  //   await this.handleExpiration(job.data.transactionId);
  // }

  private async handleExpiration(transactionId: string): Promise<void> {
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

    const subscription = await this.subscriptionRepository.findById(
      transaction.subscriptionId,
    );

    // Use domain service to handle expiration logic
    this.paymentDomainService.expirePayment(
      transaction,
      subscription ?? undefined,
    );

    // Save changes (Application Layer handles persistence)
    await this.transactionRepository.save(transaction);
    if (subscription) {
      await this.subscriptionRepository.save(subscription);
    }

    this.logger.log(`Transaction ${transactionId} has been marked as expired.`);
  }
}
