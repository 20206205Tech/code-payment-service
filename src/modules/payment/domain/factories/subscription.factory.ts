import { UserId } from '@20206205tech/nestjs-common';
import { Subscription } from '../entities/subscription';
import { PlanId } from '../value-objects/plan-id';

export class SubscriptionFactory {
  static create(
    userId: UserId,
    planId: PlanId,
    startDate: Date,
    endDate: Date,
  ): Subscription {
    return Subscription.create(userId, planId, startDate, endDate);
  }
}
