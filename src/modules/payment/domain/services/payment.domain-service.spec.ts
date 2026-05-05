import { PaymentDomainService } from './payment.domain-service';
import { Transaction } from '../entities/transaction';
import { Subscription } from '../entities/subscription';
import { Plan } from '../entities/plan';
import { UserId } from '@20206205tech/nestjs-common';
import { SubscriptionId } from '../value-objects/subscription-id';
import { PlanId } from '../value-objects/plan-id';
import { Money } from '../value-objects/money';
import { PaymentStatus } from '../value-objects/payment-status';
import { SubscriptionStatus } from '../value-objects/subscription-status';

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
      const plan = Plan.create('Pro', 1, new Money(100), true);

      service.fulfillPayment(transaction, subscription, plan);

      expect(transaction.paymentStatus).toBe(PaymentStatus.SUCCESS);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });
});
