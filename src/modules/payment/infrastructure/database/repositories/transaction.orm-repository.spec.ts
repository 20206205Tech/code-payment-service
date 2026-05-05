/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access */
import { UserId } from '@20206205tech/nestjs-common';
import { type Repository } from 'typeorm';
import { Transaction } from '../../../domain/entities/transaction';
import { Money } from '../../../domain/value-objects/money';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { TransactionId } from '../../../domain/value-objects/transaction-id';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionOrmRepository } from './transaction.orm-repository';

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
  e.discountAmount = 0;
  e.finalAmount = 100000;
  e.transactionRef = 'TXN_REF_001';
  e.paymentMethod = 'vnpay';
  e.paymentStatus = 'pending';
  e.providerTransactionId = null;
  e.paymentMetadata = {};
  e.paidAt = null;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-01');
  return e;
}

const mockTypeOrmRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  manager: {
    save: jest.fn(),
  },
} as unknown as jest.Mocked<Repository<TransactionEntity>>;

describe('TransactionOrmRepository', () => {
  let repo: TransactionOrmRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TransactionOrmRepository(mockTypeOrmRepo);
  });

  describe('findById()', () => {
    it('should return null when not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      expect(await repo.findById(new TransactionId(TXN_UUID))).toBeNull();
    });

    it('should return Transaction when found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(makeOrmEntity());
      const result = await repo.findById(new TransactionId(TXN_UUID));
      expect(result).toBeInstanceOf(Transaction);
      expect(result?.transactionId.value).toBe(TXN_UUID);
    });
  });

  describe('findByTxnRef()', () => {
    it('should return null when txnRef not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      expect(await repo.findByTxnRef('NONEXISTENT')).toBeNull();
    });

    it('should return Transaction when txnRef found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(makeOrmEntity());
      const result = await repo.findByTxnRef('TXN_REF_001');
      expect(result?.transactionRef).toBe('TXN_REF_001');
    });

    it('should query by transactionRef', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      await repo.findByTxnRef('MY_REF');
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { transactionRef: 'MY_REF' },
      });
    });
  });

  describe('findBySubscriptionId()', () => {
    it('should return Transaction when found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(makeOrmEntity());
      const result = await repo.findBySubscriptionId(SUB_UUID);
      expect(result?.subscriptionId.value).toBe(SUB_UUID);
    });

    it('should return null when not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      expect(await repo.findBySubscriptionId('non-existent')).toBeNull();
    });
  });

  describe('findAllByUserId()', () => {
    it('should return empty array when no transactions', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);
      expect(await repo.findAllByUserId(new UserId(USER_UUID))).toEqual([]);
    });

    it('should return array of Transaction domain objects', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([makeOrmEntity()]);
      const result = await repo.findAllByUserId(new UserId(USER_UUID));
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Transaction);
    });
  });

  describe('save()', () => {
    it('should call repository.save with ORM entity', async () => {
      mockTypeOrmRepo.save.mockResolvedValue(undefined);
      const txn = Transaction.create(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
        new PlanId(PLAN_UUID),
        new Money(100000),
        new Money(0),
        new Money(100000),
        'REF',
        'vnpay',
      );
      await repo.save(txn);
      expect(mockTypeOrmRepo.manager.save).toHaveBeenCalledTimes(1);

      const arg = (mockTypeOrmRepo.manager.save as jest.Mock).mock
        .calls[0][0] as TransactionEntity;
      expect(arg.transactionRef).toBe('REF');
    });
  });

  describe('delete()', () => {
    it('should call repository.delete with the ID value', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue(undefined);
      await repo.delete(new TransactionId(TXN_UUID));
      expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith(TXN_UUID);
    });
  });
});
