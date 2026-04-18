// Trong file: archive-plan.command-handler.ts (hoặc file payment-return.command-handler.ts tương ứng)

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
import { PaymentReturnCommand } from './payment-return.command';

export interface PaymentReturnResult {
  success: boolean;
  message: string;
  txnRef?: string;
}

@CommandHandler(PaymentReturnCommand)
export class PaymentReturnCommandHandler implements ICommandHandler<
  PaymentReturnCommand,
  PaymentReturnResult
> {
  private readonly logger = new Logger(PaymentReturnCommandHandler.name);

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

  async execute(command: PaymentReturnCommand): Promise<PaymentReturnResult> {
    try {
      this.logger.log('Processing return redirect');

      const verifyResult = await this.paymentGateway.verifyIpn(
        command.queryParams,
        command.provider,
      );

      if (!verifyResult.isValid) {
        return {
          success: false,
          message: 'Chữ ký không hợp lệ',
          txnRef: verifyResult.txnRef,
        };
      }

      const txn = await this.transactionRepository.findByTxnRef(
        verifyResult.txnRef,
      );
      if (!txn) {
        return {
          success: false,
          message: 'Giao dịch không tồn tại',
          txnRef: verifyResult.txnRef,
        };
      }

      // --- KHÔNG CẬP NHẬT DATABASE TẠI ĐÂY ---
      // Chúng ta sẽ để IPN (PaymentCallbackCommandHandler) xử lý việc cập nhật trạng thái đơn hàng.
      // Tại URL Return này, chúng ta chỉ quan tâm đến việc xác minh xem ZaloPay báo kết quả thế nào
      // để controller hiển thị giao diện phù hợp cho người dùng.
      // -------------------------------------------
      // -------------------------------------------

      if (txn.paymentStatus === 'expired') {
        return {
          success: false,
          message:
            'Giao dịch đã hết hạn, vui lòng liên hệ bộ phận hỗ trợ để được kiểm tra',
          txnRef: verifyResult.txnRef,
        };
      }

      return {
        success: verifyResult.isSuccess,
        message: verifyResult.message,
        txnRef: verifyResult.txnRef,
      };
    } catch (error: unknown) {
      this.logger.error('Payment return processing error:', error);
      return { success: false, message: 'Lỗi hệ thống' };
    }
  }
}
