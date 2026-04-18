import { PlanId } from '../value-objects/plan-id';
import { UserId } from '../value-objects/user-id';
import { Subscription } from '../entities/subscription';

export class SubscriptionFactory {
  static create(
    userId: string,
    planId: string,
    startDate: Date,
    endDate: Date,
  ): Subscription {
    return Subscription.create(
      new UserId(userId),
      new PlanId(planId),
      startDate,
      endDate,
    );
  }
}
