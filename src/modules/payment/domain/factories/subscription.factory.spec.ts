import { SubscriptionFactory } from './subscription.factory';
import { Subscription } from '../entities/subscription';
import { UserId } from '@20206205tech/nestjs-common';
import { PlanId } from '../value-objects/plan-id';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

describe('SubscriptionFactory', () => {
  describe('create()', () => {
    it('should create a Subscription instance', () => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 30 * 24 * 3600 * 1000);
      const sub = SubscriptionFactory.create(
        new UserId(USER_UUID),
        new PlanId(PLAN_UUID),
        startDate,
        endDate,
      );
      expect(sub).toBeInstanceOf(Subscription);
    });

    it('should set correct userId and planId', () => {
      const startDate = new Date();
      const endDate = new Date();
      const sub = SubscriptionFactory.create(
        new UserId(USER_UUID),
        new PlanId(PLAN_UUID),
        startDate,
        endDate,
      );
      expect(sub.userId.value).toBe(USER_UUID);
      expect(sub.planId.value).toBe(PLAN_UUID);
    });

    it('should start with pending status', () => {
      const sub = SubscriptionFactory.create(
        new UserId(USER_UUID),
        new PlanId(PLAN_UUID),
        new Date(),
        new Date(),
      );
      expect(sub.status).toBe('pending');
    });

    it('should throw when userId is not a valid UUID', () => {
      expect(() =>
        SubscriptionFactory.create(
          new UserId('invalid'), // or just a string if checking validation
          new PlanId(PLAN_UUID),
          new Date(),
          new Date(),
        ),
      ).toThrow('Invalid ID format');
    });
  });
});
