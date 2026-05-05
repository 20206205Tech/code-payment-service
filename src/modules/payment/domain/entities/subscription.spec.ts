import { UserId } from '@20206205tech/nestjs-common';
import { SubscriptionPurchasedEvent } from '../events/subscription-purchased.event';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { Subscription } from './subscription';
import { InvalidSubscriptionStatusException } from '../exceptions/invalid-subscription-status.exception';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';

function makeSubscription(
  status: 'pending' | 'active' | 'expired' = 'pending',
): Subscription {
  const now = new Date();
  return Subscription.reconstitute({
    id: new SubscriptionId(SUB_UUID),
    userId: new UserId(USER_UUID),
    planId: new PlanId(PLAN_UUID),
    startDate: now,
    endDate: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
    status,
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
      expect(sub.status).toBe('pending');
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
      const sub = makeSubscription('active');
      expect(sub.subscriptionId.value).toBe(SUB_UUID);
      expect(sub.status).toBe('active');
    });
  });

  describe('activate()', () => {
    it('should change status to active', () => {
      const sub = makeSubscription('pending');
      sub.activate();
      expect(sub.status).toBe('active');
    });

    it('should emit SubscriptionPurchasedEvent', () => {
      const sub = makeSubscription('pending');
      sub.activate();
      const events = sub.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionPurchasedEvent);

      const evt = events[0] as SubscriptionPurchasedEvent;
      expect(evt.subscriptionId).toBe(SUB_UUID);
      expect(evt.userId).toBe(USER_UUID);
      expect(evt.planId).toBe(PLAN_UUID);
    });

    it('should set startDate and endDate starting from baseDate when provided', () => {
      const sub = makeSubscription('pending');
      const baseDate = new Date('2026-01-01T00:00:00Z');
      const durationMonths = 3;

      sub.activate(durationMonths, baseDate);

      expect(sub.startDate.toISOString()).toBe(baseDate.toISOString());
      // Jan + 3 months = April
      expect(sub.endDate.getMonth()).toBe(3); // April is index 3
      expect(sub.endDate.getFullYear()).toBe(2026);
    });
    it('should throw InvalidSubscriptionStatusException if status is not PENDING or EXPIRED', () => {
      const sub = makeSubscription('active');
      expect(() => sub.activate()).toThrow(InvalidSubscriptionStatusException);
    });
  });

  describe('expire()', () => {
    it('should change status to expired', () => {
      const sub = makeSubscription('active');
      sub.expire();
      expect(sub.status).toBe('expired');
    });
  });
});
