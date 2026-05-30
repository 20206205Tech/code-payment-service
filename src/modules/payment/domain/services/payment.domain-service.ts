import { UserId } from '@20206205tech/nestjs-common';
import { Injectable } from '@nestjs/common';
import { addMonths } from 'date-fns';
import { Plan } from '../entities/plan';
import { Subscription } from '../entities/subscription';
import { Transaction } from '../entities/transaction';
import { SubscriptionFactory } from '../factories/subscription.factory';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionStatus } from '../value-objects/subscription-status';

@Injectable()
export class PaymentDomainService {
  /**
   * Xử lý khi thanh toán hết hạn
   */
  expirePayment(
    transaction: Transaction | null,
    subscription?: Subscription,
  ): void {
    if (transaction && transaction.isPending()) {
      transaction.markExpired();
    }

    if (subscription) {
      subscription.expire();
    }
  }

  /**
   * Xử lý khi thanh toán thành công
   */
  fulfillPayment(
    transaction: Transaction,
    subscription: Subscription,
    plan: Plan,
    baseDate: Date = new Date(),
  ): void {
    if (!transaction.isSuccess()) {
      transaction.markSuccess();
      transaction.setPaidAt(new Date());
    }

    // Luôn gọi activate() để cộng dồn thời gian và tăng version,
    // kể cả khi subscription đang ACTIVE (mua gia hạn)
    subscription.activate(plan.durationMonths, baseDate);
  }

  /**
   * Xử lý khi thanh toán thất bại
   */
  failPayment(transaction: Transaction): void {
    if (transaction && transaction.isPending()) {
      transaction.markFailed();
    }
  }

  /**
   * Chuẩn bị subscription cho việc mua plan mới
   * - Nếu chưa có subscription: tạo mới
   * - Nếu đã có subscription: tái sử dụng
   *
   * @returns { subscription, isNew } - subscription và flag cho biết có phải mới tạo không
   */
  prepareSubscriptionForPurchase(
    existingSubscription: Subscription | null,
    userId: UserId,
    planId: PlanId,
    plan: Plan,
  ): { subscription: Subscription; isNew: boolean } {
    if (existingSubscription) {
      // Tái sử dụng subscription hiện có
      return { subscription: existingSubscription, isNew: false };
    }

    // Tạo subscription mới với thời gian dựa trên plan
    const periodStart = new Date();
    const periodEnd = addMonths(periodStart, plan.durationMonths.value);
    const newSubscription = SubscriptionFactory.create(
      userId,
      planId,
      periodStart,
      periodEnd,
    );

    return { subscription: newSubscription, isNew: true };
  }

  /**
   * Kiểm tra xem subscription có đang active không
   * @param subscription - subscription cần kiểm tra
   * @param checkDate - ngày để so sánh (mặc định là hiện tại)
   * @returns true nếu subscription đang active và chưa hết hạn
   */
  isSubscriptionActive(
    subscription: Subscription,
    checkDate: Date = new Date(),
  ): boolean {
    return (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.periodEnd >= checkDate
    );
  }

  /**
   * Kiểm tra xem user có subscription active không
   * @param subscription - subscription của user (có thể null)
   * @param checkDate - ngày để so sánh (mặc định là hiện tại)
   * @returns true nếu có subscription active, false nếu không
   */
  hasActiveSubscription(
    subscription: Subscription | null,
    checkDate: Date = new Date(),
  ): boolean {
    if (!subscription) {
      return false;
    }
    return this.isSubscriptionActive(subscription, checkDate);
  }
}
