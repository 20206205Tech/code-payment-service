import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../../application/ports/database/transaction.repository.port';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../../application/ports/database/subscription.repository.port';
import { SubscriptionStatus } from '../../domain/value-objects/subscription-status';
import { PAYMENT_TIMEOUT_MS } from '../../domain/value-objects/constants';

@Injectable()
export class TransactionCleanupCron {
  private readonly logger = new Logger(TransactionCleanupCron.name);

  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {}

  /**
   * Chạy mỗi 10 phút để quét các giao dịch PENDING đã quá hạn.
   * Đây là cơ chế cứu cánh khi BullMQ bị tắt hoặc gặp lỗi.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleStaleTransactions(): Promise<void> {
    this.logger.log('Bắt đầu quét các giao dịch PENDING quá hạn...');

    const thresholdDate = new Date(Date.now() - PAYMENT_TIMEOUT_MS);

    const staleTransactions =
      await this.transactionRepository.findPendingExpired(thresholdDate);

    if (staleTransactions.length === 0) {
      this.logger.log('Không tìm thấy giao dịch nào quá hạn cần xử lý.');
      return;
    }

    this.logger.log(
      `Tìm thấy ${staleTransactions.length} giao dịch quá hạn. Đang xử lý...`,
    );

    for (const transaction of staleTransactions) {
      try {
        // Đánh dấu giao dịch hết hạn
        transaction.markExpired();
        await this.transactionRepository.save(transaction);

        // Kiểm tra và đánh dấu subscription liên quan
        const subscription = await this.subscriptionRepository.findById(
          transaction.subscriptionId,
        );

        if (
          subscription &&
          subscription.status === SubscriptionStatus.PENDING
        ) {
          subscription.expire();
          await this.subscriptionRepository.save(subscription);
          this.logger.log(
            `Đã đánh dấu hết hạn cho Transaction ${transaction.transactionId.value} và Subscription ${subscription.subscriptionId.value}`,
          );
        } else {
          this.logger.log(
            `Đã đánh dấu hết hạn cho Transaction ${transaction.transactionId.value}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Lỗi khi xử lý hết hạn cho Transaction ${transaction.transactionId.value}:`,
          error,
        );
      }
    }

    this.logger.log('Hoàn tất quét giao dịch quá hạn.');
  }
}
