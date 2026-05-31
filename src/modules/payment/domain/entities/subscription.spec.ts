import { UserId } from '@20206205tech/nestjs-common';
import { SubscriptionPurchasedEvent } from '../events/subscription-purchased.event';
import { PlanDurationMonths } from '../value-objects/plan-duration-months';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { SubscriptionStatus } from '../value-objects/subscription-status';
import { Subscription } from './subscription';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';

function makeSubscription(
  status: SubscriptionStatus = SubscriptionStatus.PENDING,
): Subscription {
  const now = new Date();
  return Subscription.reconstitute({
    id: new SubscriptionId(SUB_UUID),
    userId: new UserId(USER_UUID),
    planId: new PlanId(PLAN_UUID),
    periodStart: now,
    periodEnd: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
    status: status,
    createdAt: now,
    updatedAt: now,
    version: 1,
  });
}

describe('Subscription Entity', () => {
  describe('Subscription.create()', () => {
    it('should create a new Subscription with status = pending', () => {
      const sub = Subscription.create(
        new UserId(USER_UUID),
        new PlanId(PLAN_UUID),
        new Date(),
        new Date(),
      );
      expect(sub.status).toBe(SubscriptionStatus.PENDING);
      expect(sub.subscriptionId).toBeDefined();
      expect(sub.userId.value).toBe(USER_UUID);
      expect(sub.planId.value).toBe(PLAN_UUID);
    });

    it('should generate unique subscriptionId on each call', () => {
      const a = Subscription.create(
        new UserId(USER_UUID),
        new PlanId(PLAN_UUID),
        new Date(),
        new Date(),
      );
      const b = Subscription.create(
        new UserId(USER_UUID),
        new PlanId(PLAN_UUID),
        new Date(),
        new Date(),
      );
      expect(a.subscriptionId.value).not.toBe(b.subscriptionId.value);
    });
  });

  describe('Subscription.reconstitute()', () => {
    it('should reconstitute with correct data', () => {
      const sub = makeSubscription(SubscriptionStatus.ACTIVE);
      expect(sub.subscriptionId.value).toBe(SUB_UUID);
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('activate()', () => {
    it('should change status to active', () => {
      const sub = makeSubscription(SubscriptionStatus.PENDING);
      sub.activate(new PlanDurationMonths(1));
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should emit SubscriptionPurchasedEvent', () => {
      const sub = makeSubscription(SubscriptionStatus.PENDING);
      sub.activate(new PlanDurationMonths(1));
      const events = sub.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionPurchasedEvent);

      const evt = events[0] as SubscriptionPurchasedEvent;
      expect(evt.subscriptionId).toBe(SUB_UUID);
      expect(evt.userId).toBe(USER_UUID);
      expect(evt.planId).toBe(PLAN_UUID);
    });

    it('should set periodStart and periodEnd starting from baseDate when provided', () => {
      const sub = makeSubscription(SubscriptionStatus.PENDING);
      const baseDate = new Date('2026-01-01T00:00:00Z');
      const durationMonths = new PlanDurationMonths(3);

      sub.activate(durationMonths, baseDate);

      expect(sub.periodStart.toISOString()).toBe(baseDate.toISOString());
      // Jan + 3 months = April
      expect(sub.periodEnd.getMonth()).toBe(3); // April is index 3
      expect(sub.periodEnd.getFullYear()).toBe(2026);
    });

    it('should allow renewing an active subscription when duration is provided', () => {
      const sub = makeSubscription(SubscriptionStatus.ACTIVE);
      const originalPeriodStart = sub.periodStart.toISOString();
      const baseDate = new Date('2026-01-01T00:00:00Z');

      sub.activate(new PlanDurationMonths(3), baseDate);

      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
      expect(sub.periodStart.toISOString()).toBe(originalPeriodStart);
      expect(sub.periodEnd.getMonth()).toBe(3);
      expect(sub.periodEnd.getFullYear()).toBe(2026);
    });
  });

  describe('expire()', () => {
    it('should change status to expired', () => {
      const sub = makeSubscription(SubscriptionStatus.ACTIVE);
      sub.expire();
      expect(sub.status).toBe(SubscriptionStatus.EXPIRED);
    });
  });
});
