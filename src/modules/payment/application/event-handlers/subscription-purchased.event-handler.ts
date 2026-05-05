import { Inject } from '@nestjs/common';
import { EventsHandler } from '@nestjs/cqrs';
import { BaseEventHandler } from '@20206205tech/nestjs-common';

import { SubscriptionPurchasedEvent } from '../../domain/events/subscription-purchased.event';
import { PlanId } from '../../domain/value-objects/plan-id';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../ports/database/plan.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import {
  EMAIL_SENDER_PORT,
  type EmailSenderPort,
} from '../ports/email/email-sender.port';
import {
  USER_PROFILE_PORT,
  type UserProfilePort,
} from '../ports/service/user-profile.port';

@EventsHandler(SubscriptionPurchasedEvent)
export class SubscriptionPurchasedEventHandler extends BaseEventHandler<SubscriptionPurchasedEvent> {
  constructor(
    @Inject(USER_PROFILE_PORT)
    private readonly userProfilePort: UserProfilePort,
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSenderPort: EmailSenderPort,
  ) {
    super();
  }

  async handle(event: SubscriptionPurchasedEvent): Promise<void> {
    const { userId, planId, subscriptionId } = event;

    this.logger.log(
      `Processing SubscriptionPurchasedEvent for user ${userId}, plan ${planId}`,
    );

    try {
      // 1. Lấy thông tin email từ Transaction (vì metadata lưu lúc create)
      const txn =
        await this.transactionRepository.findBySubscriptionId(subscriptionId);
      const metadata = txn?.paymentMetadata;
      const customerEmail = metadata?.customer_email as string | undefined;

      if (!customerEmail) {
        this.logger.warn(
          `No email found for subscription ${subscriptionId}, skipping notification`,
        );
        return;
      }

      // 2. Lấy tên người dùng từ Supabase (theo code Python mẫu)
      const profile = await this.userProfilePort.getProfile(userId);
      const customerName = profile?.fullName || 'Bạn';

      // 3. Lấy thông tin gói dịch vụ
      const plan = await this.planRepository.findById(new PlanId(planId));
      const planName = plan ? plan.name : 'Gói dịch vụ';

      // 4. Gửi email thông báo
      await this.emailSenderPort.sendPaymentSuccessEmail(
        customerEmail,
        customerName,
        planName,
        txn?.transactionRef || subscriptionId,
      );

      this.logger.log(
        `Email notification sent for subscription ${subscriptionId} to ${customerEmail}`,
      );
    } catch (error) {
      this.logger.error(`Error handling SubscriptionPurchasedEvent:`, error);
    }
  }
}
