import {
  Subscription,
  type SubscriptionStatus,
} from '../../../domain/entities/subscription';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { UserId } from '../../../domain/value-objects/user-id';
import { SubscriptionEntity } from '../entities/subscription.entity';

export class SubscriptionMapper {
  static toDomain(orm: SubscriptionEntity): Subscription {
    return Subscription.reconstitute({
      id: new SubscriptionId(orm.id),
      userId: new UserId(orm.userId),
      planId: new PlanId(orm.planId),
      startDate: orm.startDate,
      endDate: orm.endDate,
      status: orm.status as SubscriptionStatus,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Subscription): SubscriptionEntity {
    const orm = new SubscriptionEntity();
    orm.id = domain.subscriptionId.value;
    orm.userId = domain.userId.value;
    orm.planId = domain.planId.value;
    orm.startDate = domain.startDate;
    orm.endDate = domain.endDate;
    orm.status = domain.status;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
