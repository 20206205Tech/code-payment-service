import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../../application/ports/database/plan.repository.port';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../../application/ports/database/subscription.repository.port';
import {
  EMAIL_SENDER_PORT,
  type EmailSenderPort,
} from '../../application/ports/email/email-sender.port';
import {
  USER_PROFILE_PORT,
  type UserProfilePort,
} from '../../application/ports/service/user-profile.port';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';
import { SUBSCRIPTION_EXPIRATION_WARNING_DAYS } from '../../domain/value-objects/constants';

@Injectable()
export class SubscriptionExpirationCron {
  private readonly logger = new Logger(SubscriptionExpirationCron.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepo: SubscriptionRepositoryPort,
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepo: PlanRepositoryPort,
    @Inject(USER_PROFILE_PORT)
    private readonly userProfileService: UserProfilePort,
    @Inject(EMAIL_SENDER_PORT)
    private readonly notificationService: EmailSenderPort,
    private readonly paymentDomainService: PaymentDomainService,
    private readonly publisher: EventPublisher,
  ) {}

  /**
   * Chạy mỗi ngày lúc nửa đêm để kiểm tra và xử lý các subscription hết hạn.
   */

  @Cron(
    process.env.ENVIRONMENT === 'production'
      ? CronExpression.EVERY_DAY_AT_MIDNIGHT
      : CronExpression.EVERY_5_MINUTES,
    // : CronExpression.EVERY_5_SECONDS,
  )
  async handleSubscriptionExpiration(): Promise<void> {
    this.logger.log(
      'Bắt đầu quy trình xử lý subscription hết hạn và thông báo...',
    );

    await this.processExpirations();
    await this.processNotifications();

    this.logger.log('Hoàn tất quy trình xử lý subscription.');
  }

  private async processExpirations(): Promise<void> {
    const now = new Date();
    const expiredSubscriptions =
      await this.subscriptionRepo.findActiveExpiringBefore(now);

    if (expiredSubscriptions.length === 0) {
      this.logger.log('Không có subscription nào hết hạn cần xử lý.');
      return;
    }

    for (const subData of expiredSubscriptions) {
      try {
        const sub = subData;

        // Use Domain Service to handle expiration logic
        this.paymentDomainService.expirePayment(null, sub);

        await this.subscriptionRepo.save(sub);

        // Gửi email thông báo đã hết hạn
        const [profile, plan] = await Promise.all([
          this.userProfileService.getProfile(sub.userId.value),
          this.planRepo.findById(sub.planId),
        ]);

        if (profile?.email) {
          await this.notificationService.sendSubscriptionExpiredEmail(
            profile.email,
            profile.fullName || 'Quý khách',
            plan?.name.value || 'Gói dịch vụ',
          );
        }

        this.logger.log(
          `Đã xử lý hết hạn cho subscription: ${sub.subscriptionId.value}`,
        );

        sub.commit();
      } catch (error) {
        this.logger.error(
          `Lỗi khi xử lý hết hạn cho subscription ${subData.subscriptionId.value}:`,
          error,
        );
      }
    }
  }

  private async processNotifications(): Promise<void> {
    const warningStart = new Date();
    warningStart.setDate(
      warningStart.getDate() + SUBSCRIPTION_EXPIRATION_WARNING_DAYS,
    );
    warningStart.setHours(0, 0, 0, 0);

    const warningEnd = new Date();
    warningEnd.setDate(
      warningEnd.getDate() + SUBSCRIPTION_EXPIRATION_WARNING_DAYS,
    );
    warningEnd.setHours(23, 59, 59, 999);

    const expiringSubscriptions =
      await this.subscriptionRepo.findActiveExpiringBetween(
        warningStart,
        warningEnd,
      );

    if (expiringSubscriptions.length === 0) {
      this.logger.log(
        `Không có subscription nào sắp hết hạn trong ${SUBSCRIPTION_EXPIRATION_WARNING_DAYS} ngày tới.`,
      );
      return;
    }

    this.logger.log(
      `Tìm thấy ${expiringSubscriptions.length} subscription sắp hết hạn trong ${SUBSCRIPTION_EXPIRATION_WARNING_DAYS} ngày tới. Đang gửi thông báo...`,
    );

    for (const sub of expiringSubscriptions) {
      try {
        const [profile, plan] = await Promise.all([
          this.userProfileService.getProfile(sub.userId.value),
          this.planRepo.findById(sub.planId),
        ]);

        if (profile?.email) {
          await this.notificationService.sendSubscriptionExpirationWarningEmail(
            profile.email,
            profile.fullName || 'Quý khách',
            plan?.name.value || 'Gói dịch vụ',
            SUBSCRIPTION_EXPIRATION_WARNING_DAYS,
          );
        }
        this.logger.log(
          `Đã gửi thông báo sắp hết hạn cho user: ${sub.userId.value}`,
        );
      } catch (error) {
        this.logger.error(
          `Lỗi khi gửi thông báo sắp hết hạn cho subscription ${sub.subscriptionId.value}:`,
          error,
        );
      }
    }
  }
}
