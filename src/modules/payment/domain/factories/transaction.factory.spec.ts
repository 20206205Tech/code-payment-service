import { TransactionFactory } from './transaction.factory';
import { Transaction } from '../entities/transaction';
import { UserId } from '@20206205tech/nestjs-common';
import { SubscriptionId } from '../value-objects/subscription-id';
import { PlanId } from '../value-objects/plan-id';
import { Money } from '../value-objects/money';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

describe('TransactionFactory', () => {
  describe('create()', () => {
    it('should create a Transaction instance', () => {
      const txn = TransactionFactory.create(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
        new PlanId(PLAN_UUID),
        new Money(100000),
        new Money(0),
        new Money(100000),
        'TXN_REF_ABC',
        'vnpay',
      );
      expect(txn).toBeInstanceOf(Transaction);
    });

    it('should set all amounts correctly as Money objects', () => {
      const txn = TransactionFactory.create(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
        new PlanId(PLAN_UUID),
        new Money(200000),
        new Money(20000),
        new Money(180000),
        'REF_001',
        'zalopay',
      );
      expect(txn.baseAmount.amount).toBe(200000);
      expect(txn.discountAmount.amount).toBe(20000);
      expect(txn.finalAmount.amount).toBe(180000);
    });

    it('should set userId, subscriptionId, planId correctly', () => {
      const txn = TransactionFactory.create(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
        new PlanId(PLAN_UUID),
        new Money(100000),
        new Money(0),
        new Money(100000),
        'REF',
        'momo',
      );
      expect(txn.userId.value).toBe(USER_UUID);
      expect(txn.subscriptionId.value).toBe(SUB_UUID);
      expect(txn.planId.value).toBe(PLAN_UUID);
    });

    it('should have pending status initially', () => {
      const txn = TransactionFactory.create(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
        new PlanId(PLAN_UUID),
        new Money(1),
        new Money(0),
        new Money(1),
        'R',
        'vnpay',
      );
      expect(txn.paymentStatus).toBe('pending');
    });

    it('should default metadata to empty object', () => {
      const txn = TransactionFactory.create(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
        new PlanId(PLAN_UUID),
        new Money(1),
        new Money(0),
        new Money(1),
        'R',
        'vnpay',
      );
      expect(txn.paymentMetadata).toEqual({});
    });

    it('should store provided metadata', () => {
      const txn = TransactionFactory.create(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
        new PlanId(PLAN_UUID),
        new Money(1),
        new Money(0),
        new Money(1),
        'R',
        'vnpay',
        { customer_email: 'a@b.com' },
      );
      expect(txn.paymentMetadata).toEqual({ customer_email: 'a@b.com' });
    });

    it('should throw when userId is invalid UUID', () => {
      expect(() =>
        TransactionFactory.create(
          new UserId('invalid'),
          new SubscriptionId(SUB_UUID),
          new PlanId(PLAN_UUID),
          new Money(1),
          new Money(0),
          new Money(1),
          'R',
          'vnpay',
        ),
      ).toThrow('Invalid ID format');
    });
  });
});
