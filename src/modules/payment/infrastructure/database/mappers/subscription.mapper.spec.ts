import { UserId } from '@20206205tech/nestjs-common';
import { Subscription } from '../../../domain/entities/subscription';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { SubscriptionStatus } from '../../../domain/value-objects/subscription-status';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionMapper } from './subscription.mapper';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';

function makeOrmEntity(
  status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
): SubscriptionEntity {
  const e = new SubscriptionEntity();
  e.id = SUB_UUID;
  e.userId = USER_UUID;
  e.planId = PLAN_UUID;
  e.periodStart = new Date('2024-01-01');
  e.periodEnd = new Date('2024-02-01');
  e.status = status;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-01');
  return e;
}

describe('SubscriptionMapper', () => {
  describe('toDomain()', () => {
    it('should map ORM entity to domain Subscription', () => {
      const orm = makeOrmEntity();
      const domain = SubscriptionMapper.toDomain(orm);

      expect(domain).toBeInstanceOf(Subscription);
      expect(domain.subscriptionId.value).toBe(SUB_UUID);
      expect(domain.userId.value).toBe(USER_UUID);
      expect(domain.planId.value).toBe(PLAN_UUID);
      expect(domain.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should correctly map all statuses', () => {
      for (const status of [
        SubscriptionStatus.PENDING,
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.EXPIRED,
      ]) {
        const orm = makeOrmEntity(status);
        const domain = SubscriptionMapper.toDomain(orm);
        expect(domain.status).toBe(status);
      }
    });
  });

  describe('toOrm()', () => {
    it('should map domain Subscription to ORM entity', () => {
      const now = new Date();
      const domain = Subscription.reconstitute({
        id: new SubscriptionId(SUB_UUID),
        userId: new UserId(USER_UUID),
        planId: new PlanId(PLAN_UUID),
        periodStart: now,
        periodEnd: now,
        status: SubscriptionStatus.PENDING,
        createdAt: now,
        updatedAt: now,
        version: 1,
      });

      const orm = SubscriptionMapper.toOrm(domain);

      expect(orm).toBeInstanceOf(SubscriptionEntity);
      expect(orm.id).toBe(SUB_UUID);
      expect(orm.userId).toBe(USER_UUID);
      expect(orm.planId).toBe(PLAN_UUID);
      expect(orm.status).toBe(SubscriptionStatus.PENDING);
    });
  });

  describe('roundtrip', () => {
    it('should preserve all data through toDomain → toOrm cycle', () => {
      const orm = makeOrmEntity(SubscriptionStatus.ACTIVE);
      const domain = SubscriptionMapper.toDomain(orm);
      const restored = SubscriptionMapper.toOrm(domain);

      expect(restored.id).toBe(orm.id);
      expect(restored.userId).toBe(orm.userId);
      expect(restored.planId).toBe(orm.planId);
      expect(restored.status).toBe(orm.status);
    });
  });
});
