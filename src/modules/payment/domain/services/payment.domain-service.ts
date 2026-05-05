import { Injectable } from '@nestjs/common';
import { Transaction } from '../entities/transaction';
import { Subscription } from '../entities/subscription';
import { Plan } from '../entities/plan';
import { SubscriptionStatus } from '../value-objects/subscription-status';

@Injectable()
export class PaymentDomainService {
  /**
   * Xử lý khi thanh toán hết hạn
   */
  expirePayment(transaction: Transaction, subscription?: Subscription): void {
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

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      subscription.activate(plan.durationMonths, baseDate);
    }
  }

  /**
   * Xử lý khi thanh toán thất bại
   */
  failPayment(transaction: Transaction): void {
    if (transaction && transaction.isPending()) {
      transaction.markFailed();
    }
  }
}
