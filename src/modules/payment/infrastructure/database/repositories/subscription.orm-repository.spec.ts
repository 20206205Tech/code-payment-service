/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access */
import { UserId } from '@20206205tech/nestjs-common';
import { type Repository } from 'typeorm';
import { Subscription } from '../../../domain/entities/subscription';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { SubscriptionStatus } from '../../../domain/value-objects/subscription-status';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionOrmRepository } from './subscription.orm-repository';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';
const SUB_UUID2 = '55555555-5555-5555-8555-555555555555';

function makeOrmEntity(
  id = SUB_UUID,
  status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
): SubscriptionEntity {
  const e = new SubscriptionEntity();
  e.id = id;
  e.userId = USER_UUID;
  e.planId = PLAN_UUID;
  e.periodStart = new Date('2024-01-01');
  e.periodEnd = new Date('2024-02-01');
  e.status = status;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-01');
  e.version = 1;
  return e;
}

const mockTypeOrmRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  manager: {
    save: jest.fn(),
    create: jest.fn(),
  },
} as unknown as jest.Mocked<Repository<SubscriptionEntity>>;

describe('SubscriptionOrmRepository', () => {
  let repo: SubscriptionOrmRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new SubscriptionOrmRepository(mockTypeOrmRepo);
  });

  describe('findById()', () => {
    it('should return null when not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      expect(await repo.findById(new SubscriptionId(SUB_UUID))).toBeNull();
    });

    it('should return Subscription when found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(makeOrmEntity());
      const result = await repo.findById(new SubscriptionId(SUB_UUID));
      expect(result).toBeInstanceOf(Subscription);
    });
  });

  describe('findByUserId()', () => {
    it('should return null when no subscription found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      expect(await repo.findByUserId(new UserId(USER_UUID))).toBeNull();
    });

    it('should return latest Subscription ordered by createdAt DESC', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(makeOrmEntity());
      const result = await repo.findByUserId(new UserId(USER_UUID));
      expect(result).toBeInstanceOf(Subscription);
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('isFirstPurchase()', () => {
    it('should return true when count = 0', async () => {
      mockTypeOrmRepo.count.mockResolvedValue(0);
      expect(await repo.isFirstPurchase(new UserId(USER_UUID))).toBe(true);
    });

    it('should return false when count > 0', async () => {
      mockTypeOrmRepo.count.mockResolvedValue(3);
      expect(await repo.isFirstPurchase(new UserId(USER_UUID))).toBe(false);
    });
  });

  describe('deactivateOtherSubscriptions()', () => {
    it('should expire all other active subscriptions', async () => {
      const other1 = makeOrmEntity(SUB_UUID2, SubscriptionStatus.ACTIVE);
      mockTypeOrmRepo.find.mockResolvedValue([other1]);
      mockTypeOrmRepo.save.mockResolvedValue(undefined);

      await repo.deactivateOtherSubscriptions(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
      );

      expect(other1.status).toBe(SubscriptionStatus.EXPIRED);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(other1);
    });

    it('should not save anything when no other active subscriptions', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);
      await repo.deactivateOtherSubscriptions(
        new UserId(USER_UUID),
        new SubscriptionId(SUB_UUID),
      );
      expect(mockTypeOrmRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('save()', () => {
    it('should call repository.save with ORM entity', async () => {
      mockTypeOrmRepo.save.mockResolvedValue(undefined);
      const now = new Date();
      const sub = Subscription.reconstitute({
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
      await repo.save(sub);
      expect(mockTypeOrmRepo.manager.save).toHaveBeenCalledTimes(1);

      const arg = (mockTypeOrmRepo.manager.save as jest.Mock).mock
        .calls[0][0] as SubscriptionEntity;
      expect(arg.id).toBe(SUB_UUID);
    });
  });

  describe('findLatestActiveSubscription()', () => {
    it('should return subscription with latest periodEnd', async () => {
      const e = makeOrmEntity();
      mockTypeOrmRepo.findOne.mockResolvedValue(e);
      const result = await repo.findLatestActiveSubscription(
        new UserId(USER_UUID),
      );
      expect(result).toBeDefined();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { periodEnd: 'DESC' },
        }),
      );
    });
  });

  describe('delete()', () => {
    it('should call repository.delete with the ID value', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue(undefined);
      await repo.delete(new SubscriptionId(SUB_UUID));
      expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith(SUB_UUID);
    });
  });
});
