import { UserId } from '@20206205tech/nestjs-common';
import { Money } from '../value-objects/money';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { TransactionId } from '../value-objects/transaction-id';
import { Transaction } from './transaction';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';
const TXN_UUID = '44444444-4444-4444-8444-444444444444';

function makeTransaction(): Transaction {
  return Transaction.create(
    new UserId(USER_UUID),
    new SubscriptionId(SUB_UUID),
    new PlanId(PLAN_UUID),
    new Money(100000),
    new Money(0),
    new Money(100000),
    'TXN_REF_001',
    'vnpay',
    { customer_email: 'test@example.com' },
  );
}

describe('Transaction Entity', () => {
  describe('Transaction.create()', () => {
    it('should create with status = pending', () => {
      const txn = makeTransaction();
      expect(txn.paymentStatus).toBe('pending');
    });

    it('should store all amounts correctly', () => {
      const txn = makeTransaction();
      expect(txn.baseAmount.amount).toBe(100000);
      expect(txn.discountAmount.amount).toBe(0);
      expect(txn.finalAmount.amount).toBe(100000);
    });

    it('should have null providerTransactionId and paidAt initially', () => {
      const txn = makeTransaction();
      expect(txn.providerTransactionId).toBeNull();
      expect(txn.paidAt).toBeNull();
    });

    it('should store payment metadata', () => {
      const txn = makeTransaction();
      expect(txn.paymentMetadata).toEqual({
        customer_email: 'test@example.com',
      });
    });

    it('should generate a unique transactionId', () => {
      const a = makeTransaction();
      const b = makeTransaction();
      expect(a.transactionId.value).not.toBe(b.transactionId.value);
    });
  });

  describe('Transaction.reconstitute()', () => {
    it('should reconstitute correctly from persistence', () => {
      const now = new Date();
      const txn = Transaction.reconstitute({
        id: new TransactionId(TXN_UUID),
        userId: new UserId(USER_UUID),
        subscriptionId: new SubscriptionId(SUB_UUID),
        planId: new PlanId(PLAN_UUID),
        baseAmount: new Money(200000),
        discountAmount: new Money(20000),
        finalAmount: new Money(180000),
        transactionRef: 'REF_001',
        paymentMethod: 'zalopay',
        paymentStatus: 'success',
        providerTransactionId: 'ZALO_123',
        paymentMetadata: {},
        paidAt: now,
        createdAt: now,
        updatedAt: now,
        version: 1,
      });
      expect(txn.transactionId.value).toBe(TXN_UUID);
      expect(txn.paymentStatus).toBe('success');
      expect(txn.providerTransactionId).toBe('ZALO_123');
    });
  });

  describe('isPending() / isSuccess()', () => {
    it('isPending() should return true for pending status', () => {
      const txn = makeTransaction();
      expect(txn.isPending()).toBe(true);
      expect(txn.isSuccess()).toBe(false);
    });

    it('isSuccess() should return true after markSuccess', () => {
      const txn = makeTransaction();
      txn.markSuccess();
      expect(txn.isSuccess()).toBe(true);
      expect(txn.isPending()).toBe(false);
    });
  });

  describe('markSuccess()', () => {
    it('should change status to success', () => {
      const txn = makeTransaction();
      txn.markSuccess();
      expect(txn.paymentStatus).toBe('success');
    });
  });

  describe('markFailed()', () => {
    it('should change status to failed', () => {
      const txn = makeTransaction();
      txn.markFailed();
      expect(txn.paymentStatus).toBe('failed');
    });
  });

  describe('markExpired()', () => {
    it('should change status to expired', () => {
      const txn = makeTransaction();
      txn.markExpired();
      expect(txn.paymentStatus).toBe('expired');
    });
  });

  describe('setProviderTransactionId()', () => {
    it('should set providerTransactionId', () => {
      const txn = makeTransaction();
      txn.setProviderTransactionId('PROVIDER_XYZ');
      expect(txn.providerTransactionId).toBe('PROVIDER_XYZ');
    });
  });

  describe('setPaidAt()', () => {
    it('should set paidAt', () => {
      const txn = makeTransaction();
      const date = new Date('2024-01-01');
      txn.setPaidAt(date);
      expect(txn.paidAt).toEqual(date);
    });
  });

  describe('mergePaymentMetadata()', () => {
    it('should merge new data into existing metadata', () => {
      const txn = makeTransaction();
      txn.mergePaymentMetadata({ provider_ref: 'ABC' });
      expect(txn.paymentMetadata).toMatchObject({
        customer_email: 'test@example.com',
        provider_ref: 'ABC',
      });
    });

    it('should overwrite existing keys', () => {
      const txn = makeTransaction();
      txn.mergePaymentMetadata({ customer_email: 'new@example.com' });
      expect(txn.paymentMetadata['customer_email']).toBe('new@example.com');
    });
  });
});
