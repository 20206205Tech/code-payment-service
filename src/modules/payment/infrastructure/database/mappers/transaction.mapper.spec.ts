import { UserId } from '@20206205tech/nestjs-common';
import { Transaction } from '../../../domain/entities/transaction';
import { Money } from '../../../domain/value-objects/money';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { TransactionId } from '../../../domain/value-objects/transaction-id';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionMapper } from './transaction.mapper';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';
const TXN_UUID = '44444444-4444-4444-8444-444444444444';

function makeOrmEntity(): TransactionEntity {
  const e = new TransactionEntity();
  e.id = TXN_UUID;
  e.userId = USER_UUID;
  e.subscriptionId = SUB_UUID;
  e.planId = PLAN_UUID;
  e.baseAmount = 100000;
  e.discountAmount = 10000;
  e.finalAmount = 90000;
  e.transactionRef = 'TXN_REF_001';
  e.paymentMethod = 'vnpay';
  e.paymentStatus = 'pending';
  e.providerTransactionId = null;
  e.paymentMetadata = { customer_email: 'test@example.com' };
  e.paidAt = null;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-01');
  return e;
}

describe('TransactionMapper', () => {
  describe('toDomain()', () => {
    it('should map ORM entity to domain Transaction', () => {
      const orm = makeOrmEntity();
      const domain = TransactionMapper.toDomain(orm);

      expect(domain).toBeInstanceOf(Transaction);
      expect(domain.transactionId.value).toBe(TXN_UUID);
      expect(domain.userId.value).toBe(USER_UUID);
      expect(domain.subscriptionId.value).toBe(SUB_UUID);
      expect(domain.planId.value).toBe(PLAN_UUID);
      expect(domain.baseAmount.amount).toBe(100000);
      expect(domain.discountAmount.amount).toBe(10000);
      expect(domain.finalAmount.amount).toBe(90000);
      expect(domain.paymentStatus).toBe('pending');
      expect(domain.providerTransactionId).toBeNull();
    });

    it('should handle decimal amounts from DB (TypeORM returns string)', () => {
      const orm = makeOrmEntity();
      orm.baseAmount = '100000.00' as unknown as number;
      orm.discountAmount = '10000.00' as unknown as number;
      orm.finalAmount = '90000.00' as unknown as number;

      const domain = TransactionMapper.toDomain(orm);
      expect(domain.baseAmount.amount).toBe(100000);
      expect(domain.finalAmount.amount).toBe(90000);
    });
  });

  describe('toOrm()', () => {
    it('should map domain Transaction to ORM entity', () => {
      const domain = Transaction.reconstitute({
        id: new TransactionId(TXN_UUID),
        userId: new UserId(USER_UUID),
        subscriptionId: new SubscriptionId(SUB_UUID),
        planId: new PlanId(PLAN_UUID),
        baseAmount: new Money(200000),
        discountAmount: new Money(0),
        finalAmount: new Money(200000),
        transactionRef: 'REF',
        paymentMethod: 'zalopay',
        paymentStatus: 'success',
        providerTransactionId: 'ZALO_123',
        paymentMetadata: {},
        paidAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });

      const orm = TransactionMapper.toOrm(domain);

      expect(orm).toBeInstanceOf(TransactionEntity);
      expect(orm.id).toBe(TXN_UUID);
      expect(orm.paymentStatus).toBe('success');
      expect(orm.providerTransactionId).toBe('ZALO_123');
      expect(orm.baseAmount).toBe(200000);
    });
  });

  describe('roundtrip', () => {
    it('should preserve all data through toDomain → toOrm cycle', () => {
      const orm = makeOrmEntity();
      const domain = TransactionMapper.toDomain(orm);
      const restored = TransactionMapper.toOrm(domain);

      expect(restored.id).toBe(orm.id);
      expect(restored.transactionRef).toBe(orm.transactionRef);
      expect(restored.paymentMethod).toBe(orm.paymentMethod);
      expect(restored.paymentStatus).toBe(orm.paymentStatus);
    });
  });
});
