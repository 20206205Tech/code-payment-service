import { UserId } from '@20206205tech/nestjs-common';
import { addMonths } from 'date-fns';
import { Plan } from '../entities/plan';
import { Subscription } from '../entities/subscription';
import { Transaction } from '../entities/transaction';
import { Money } from '../value-objects/money';
import { PaymentStatus } from '../value-objects/payment-status';
import { PlanDurationMonths } from '../value-objects/plan-duration-months';
import { PlanId } from '../value-objects/plan-id';
import { PlanName } from '../value-objects/plan-name';
import { SubscriptionId } from '../value-objects/subscription-id';
import { SubscriptionStatus } from '../value-objects/subscription-status';
import { PaymentDomainService } from './payment.domain-service';

describe('PaymentDomainService', () => {
  let service: PaymentDomainService;

  beforeEach(() => {
    service = new PaymentDomainService();
  });

  describe('expirePayment', () => {
    it('should mark transaction and subscription as expired', () => {
      const transaction = Transaction.create(
        new UserId('11111111-1111-1111-8111-111111111111'),
        new SubscriptionId('33333333-3333-3333-8333-333333333333'),
        new PlanId('22222222-2222-2222-8222-222222222222'),
        new Money(100),
        new Money(0),
        new Money(100),
        'REF',
        'vnpay',
      );
      const subscription = Subscription.create(
        new UserId('11111111-1111-1111-8111-111111111111'),
        new PlanId('22222222-2222-2222-8222-222222222222'),
        new Date(),
        new Date(),
      );

      service.expirePayment(transaction, subscription);

      expect(transaction.paymentStatus).toBe(PaymentStatus.EXPIRED);
      expect(subscription.status).toBe(SubscriptionStatus.EXPIRED);
    });
  });

  describe('fulfillPayment', () => {
    it('should mark transaction success and activate subscription', () => {
      const transaction = Transaction.create(
        new UserId('11111111-1111-1111-8111-111111111111'),
        new SubscriptionId('33333333-3333-3333-8333-333333333333'),
        new PlanId('22222222-2222-2222-8222-222222222222'),
        new Money(100),
        new Money(0),
        new Money(100),
        'REF',
        'vnpay',
      );
      const subscription = Subscription.create(
        new UserId('11111111-1111-1111-8111-111111111111'),
        new PlanId('22222222-2222-2222-8222-222222222222'),
        new Date(),
        new Date(),
      );
      const plan = Plan.create(
        new PlanName('Pro'),
        new PlanDurationMonths(1),
        new Money(100),
        true,
      );

      service.fulfillPayment(transaction, subscription, plan);

      expect(transaction.paymentStatus).toBe(PaymentStatus.SUCCESS);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('prepareSubscriptionForPurchase', () => {
    const userId = new UserId('11111111-1111-1111-8111-111111111111');
    const planId = new PlanId('22222222-2222-2222-8222-222222222222');
    const plan = Plan.create(
      new PlanName('Pro Monthly'),
      new PlanDurationMonths(1),
      new Money(99000),
      true,
    );

    it('should return existing subscription when it exists', () => {
      const existingSubscription = Subscription.create(
        userId,
        planId,
        new Date(),
        new Date(),
      );

      const result = service.prepareSubscriptionForPurchase(
        existingSubscription,
        userId,
        planId,
        plan,
      );

      expect(result.subscription).toBe(existingSubscription);
      expect(result.isNew).toBe(false);
    });

    it('should create new subscription when none exists', () => {
      const result = service.prepareSubscriptionForPurchase(
        null,
        userId,
        planId,
        plan,
      );

      expect(result.subscription).toBeInstanceOf(Subscription);
      expect(result.subscription.userId).toEqual(userId);
      expect(result.subscription.planId).toEqual(planId);
      expect(result.isNew).toBe(true);
    });

    it('should set correct dates for new subscription based on plan duration', () => {
      const result = service.prepareSubscriptionForPurchase(
        null,
        userId,
        planId,
        plan,
      );

      const periodStart = result.subscription.periodStart;
      const periodEnd = result.subscription.periodEnd;

      // Kiểm tra periodEnd = periodStart + plan.durationMonths
      const expectedEndDate = addMonths(periodStart, plan.durationMonths.value);

      expect(periodEnd.getTime()).toBeGreaterThanOrEqual(
        expectedEndDate.getTime() - 1000,
      ); // Allow 1s tolerance
      expect(periodEnd.getTime()).toBeLessThanOrEqual(
        expectedEndDate.getTime() + 1000,
      );
    });
  });

  describe('isSubscriptionActive', () => {
    const userId = new UserId('11111111-1111-1111-8111-111111111111');
    const planId = new PlanId('22222222-2222-2222-8222-222222222222');

    it('should return true when subscription is active and not expired', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const subscription = Subscription.reconstitute({
        id: new SubscriptionId('33333333-3333-3333-8333-333333333333'),
        userId,
        planId,
        periodStart: new Date(),
        periodEnd: futureDate,
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      expect(service.isSubscriptionActive(subscription)).toBe(true);
    });

    it('should return false when subscription is expired', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const subscription = Subscription.reconstitute({
        id: new SubscriptionId('33333333-3333-3333-8333-333333333333'),
        userId,
        planId,
        periodStart: new Date(),
        periodEnd: pastDate,
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      expect(service.isSubscriptionActive(subscription)).toBe(false);
    });

    it('should return false when subscription status is not active', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const subscription = Subscription.reconstitute({
        id: new SubscriptionId('33333333-3333-3333-8333-333333333333'),
        userId,
        planId,
        periodStart: new Date(),
        periodEnd: futureDate,
        status: SubscriptionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      expect(service.isSubscriptionActive(subscription)).toBe(false);
    });
  });

  describe('hasActiveSubscription', () => {
    const userId = new UserId('11111111-1111-1111-8111-111111111111');
    const planId = new PlanId('22222222-2222-2222-8222-222222222222');

    it('should return false when subscription is null', () => {
      expect(service.hasActiveSubscription(null)).toBe(false);
    });

    it('should return true when subscription is active', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const subscription = Subscription.reconstitute({
        id: new SubscriptionId('33333333-3333-3333-8333-333333333333'),
        userId,
        planId,
        periodStart: new Date(),
        periodEnd: futureDate,
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      expect(service.hasActiveSubscription(subscription)).toBe(true);
    });

    it('should return false when subscription is not active', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const subscription = Subscription.reconstitute({
        id: new SubscriptionId('33333333-3333-3333-8333-333333333333'),
        userId,
        planId,
        periodStart: new Date(),
        periodEnd: pastDate,
        status: SubscriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      expect(service.hasActiveSubscription(subscription)).toBe(false);
    });
  });
});
