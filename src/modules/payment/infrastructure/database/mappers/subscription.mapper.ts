import { UserId } from '@20206205tech/nestjs-common';
import { Subscription } from '../../../domain/entities/subscription';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { SubscriptionEntity } from '../entities/subscription.entity';

export class SubscriptionMapper {
  static toDomain(orm: SubscriptionEntity): Subscription {
    return Subscription.reconstitute({
      id: new SubscriptionId(orm.id),
      userId: new UserId(orm.userId),
      planId: new PlanId(orm.planId),
      periodStart: orm.periodStart,
      periodEnd: orm.periodEnd,
      status: orm.status,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      version: orm.version,
    });
  }

  static toOrm(domain: Subscription): SubscriptionEntity {
    const orm = new SubscriptionEntity();
    orm.id = domain.subscriptionId.value;
    orm.userId = domain.userId.value;
    orm.planId = domain.planId.value;
    orm.periodStart = domain.periodStart;
    orm.periodEnd = domain.periodEnd;
    orm.status = domain.status;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.version = domain.version.value;
    return orm;
  }
}
