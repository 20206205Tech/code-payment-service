import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@20206205tech/nestjs-common';

import { DataSource } from 'typeorm';
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
import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';
import { SubscriptionNotFoundException } from '../../domain/exceptions/subscription-not-found.exception';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';
import { PaymentStatus } from '../../domain/value-objects/payment-status';
import {
  PAYMENT_GATEWAY_PORT,
  type PaymentGatewayPort,
} from '../ports/payment/payment-gateway.port';
import { PaymentCallbackCommand } from './payment-callback.command';

@CommandHandler(PaymentCallbackCommand)
export class PaymentCallbackCommandHandler extends BaseCommandHandler<
  PaymentCallbackCommand,
  { success: boolean; message: string }
> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly dataSource: DataSource,
    private readonly publisher: EventPublisher,
    private readonly paymentDomainService: PaymentDomainService,
  ) {
    super();
  }

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

      // Kiểm tra số tiền (Security check)
      if (
        verifyResult.amount !== undefined &&
        Math.abs(verifyResult.amount - txn.finalAmount.amount) > 0.01
      ) {
        this.logger.error(
          `Amount mismatch for txn ${txn.transactionRef}. Expected: ${txn.finalAmount.amount}, Received: ${verifyResult.amount}`,
        );
        return { success: false, message: 'Số tiền không khớp' };
      }

      if (txn.paymentStatus === PaymentStatus.EXPIRED) {
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

      const [subscriptionData, plan] = await Promise.all([
        this.subscriptionRepository.findById(txn.subscriptionId),
        this.planRepository.findById(txn.planId),
      ]);

      if (!subscriptionData) {
        this.logger.error(
          `Subscription not found for txn ${txn.transactionRef}`,
        );
        throw new SubscriptionNotFoundException(txn.subscriptionId.value);
      }

      if (!plan) {
        throw new PlanNotFoundException(txn.planId.value);
      }

      const subscription = subscriptionData;

      if (verifyResult.isSuccess) {
        // Tìm gói đang active có hạn xa nhất để cộng dồn
        const latestActiveSub =
          await this.subscriptionRepository.findLatestActiveSubscription(
            txn.userId,
          );

        let baseDate = new Date();
        if (latestActiveSub && latestActiveSub.periodEnd > baseDate) {
          baseDate = latestActiveSub.periodEnd;
          this.logger.log(
            `Stacking subscription for user ${txn.userId.value}. New periodStart: ${baseDate.toISOString()}`,
          );
        }

        // Use domain service for fulfillment
        this.paymentDomainService.fulfillPayment(
          txn,
          subscription,
          plan,
          baseDate,
        );
        txn.setPaidAt(new Date());

        await this.dataSource.transaction(async (manager) => {
          // Không gọi deactivateOtherSubscriptions nữa để cộng dồn
          await this.subscriptionRepository.save(subscription, manager);
          await this.transactionRepository.save(txn, manager);
        });

        subscription.commit();

        return { success: true, message: 'Thanh toán thành công' };
      } else {
        this.logger.warn(
          `Marking txn ${txn.transactionRef} as FAILED. Reason: ${verifyResult.message}`,
        );
        this.paymentDomainService.failPayment(txn);
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
