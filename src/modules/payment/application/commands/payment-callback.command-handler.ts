import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
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
import {
  PAYMENT_GATEWAY_PORT,
  type PaymentGatewayPort,
} from '../ports/payment/payment-gateway.port';
import { PaymentCallbackCommand } from './payment-callback.command';

@CommandHandler(PaymentCallbackCommand)
export class PaymentCallbackCommandHandler implements ICommandHandler<PaymentCallbackCommand> {
  private readonly logger = new Logger(PaymentCallbackCommandHandler.name);

  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(
    command: PaymentCallbackCommand,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Processing IPN callback');

      const verifyResult = await this.paymentGateway.verifyIpn(
        command.requestData,
        command.provider,
      );

      if (!verifyResult.isValid) {
        this.logger.warn(`IPN verification failed: ${verifyResult.message}`);
        return { success: false, message: 'Sai chữ ký bảo mật' };
      }

      this.logger.log(
        `IPN verified successfully for txnRef: ${verifyResult.txnRef}`,
      );

      const txn = await this.transactionRepository.findByTxnRef(
        verifyResult.txnRef,
      );
      if (!txn) {
        this.logger.error(`Transaction not found: ${verifyResult.txnRef}`);
        return { success: false, message: 'Giao dịch không tồn tại' };
      }

      if (txn.paymentStatus === 'expired') {
        this.logger.warn(
          `Transaction ${txn.transactionRef} paid BUT EXPIRED. Manual support required.`,
        );
        return {
          success: true,
          message: 'Giao dịch đã hết hạn, vui lòng liên hệ bộ phận hỗ trợ',
        };
      }

      if (!txn.isPending()) {
        this.logger.warn(
          `Transaction ${txn.transactionRef} already processed (status: ${txn.paymentStatus})`,
        );
        return { success: true, message: 'Giao dịch đã được xử lý' };
      }

      // Cập nhật thông tin giao dịch
      txn.mergePaymentMetadata(command.requestData);
      txn.setProviderTransactionId(verifyResult.providerTransId);
      txn.setPaidAt(new Date());

      const subscriptionData = await this.subscriptionRepository.findById(
        txn.subscriptionId,
      );
      if (!subscriptionData) {
        this.logger.error(
          `Subscription not found for txn ${txn.transactionRef}`,
        );
        throw new Error('Subscription not found');
      }

      // Merge context để hỗ trợ domain events
      const subscription = this.publisher.mergeObjectContext(subscriptionData);

      if (verifyResult.isSuccess) {
        this.logger.log(
          `Activating subscription and marking txn ${txn.transactionRef} as SUCCESS`,
        );
        txn.markSuccess();
        subscription.activate();

        // Lưu trạng thái
        await this.subscriptionRepository.deactivateOtherSubscriptions(
          txn.userId,
          subscription.subscriptionId,
        );
        await this.subscriptionRepository.save(subscription);
        await this.transactionRepository.save(txn);

        // Commit các domain events (vd: SubscriptionPurchasedEvent)
        subscription.commit();

        return { success: true, message: 'Thanh toán thành công' };
      } else {
        this.logger.warn(
          `Marking txn ${txn.transactionRef} as FAILED. Reason: ${verifyResult.message}`,
        );
        txn.markFailed();
        // Nếu thanh toán thất bại, ta không kích hoạt gói (giữ ở trạng thái pending hoặc cancel nếu cần)
        await this.transactionRepository.save(txn);
        return { success: false, message: verifyResult.message };
      }
    } catch (error: unknown) {
      this.logger.error('IPN processing error:', error);
      return { success: false, message: String(error) };
    }
  }
}
