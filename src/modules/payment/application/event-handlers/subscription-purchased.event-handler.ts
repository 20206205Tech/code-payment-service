import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPurchasedEvent } from '../../domain/events/subscription-purchased.event';
import {
  USER_PROFILE_PORT,
  type UserProfilePort,
} from '../ports/services/user-profile.port';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../ports/database/plan.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import {
  NOTIFICATION_PORT,
  type NotificationPort,
} from '../ports/service/notification.port';
import { PlanId } from '../../domain/value-objects/plan-id';
import { OutboxEntity } from '../../infrastructure/database/entities/outbox.entity';

@EventsHandler(SubscriptionPurchasedEvent)
export class SubscriptionPurchasedEventHandler implements IEventHandler<SubscriptionPurchasedEvent> {
  private readonly logger = new Logger(SubscriptionPurchasedEventHandler.name);

  constructor(
    @Inject(USER_PROFILE_PORT)
    private readonly userProfilePort: UserProfilePort,
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(NOTIFICATION_PORT)
    private readonly notificationPort: NotificationPort,
    @InjectRepository(OutboxEntity)
    private readonly outboxRepo: Repository<OutboxEntity>,
  ) {}

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
      await this.notificationPort.sendPaymentSuccessEmail(
        customerEmail,
        customerName,
        planName,
        txn?.transactionRef || subscriptionId,
      );

      this.logger.log(
        `Email notification sent for subscription ${subscriptionId} to ${customerEmail}`,
      );

      // 5. Ghi outbox record để relay lên Kafka Aiven
      await this.outboxRepo.save(
        this.outboxRepo.create({
          aggregateType: 'Subscription',
          aggregateId: subscriptionId,
          eventType: 'SubscriptionPurchasedEvent',
          payload: {
            subscriptionId,
            userId,
            planId,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
          },
          status: 'PENDING',
          retryCount: 0,
        }),
      );

      this.logger.log(
        `📥 Outbox: recorded SubscriptionPurchasedEvent for subscriptionId=${subscriptionId} → pending Kafka relay`,
      );
    } catch (error) {
      this.logger.error(`Error handling SubscriptionPurchasedEvent:`, error);
    }
  }
}
