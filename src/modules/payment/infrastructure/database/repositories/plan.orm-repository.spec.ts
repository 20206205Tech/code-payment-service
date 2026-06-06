/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { Repository } from 'typeorm';
import { Plan } from '../../../domain/entities/plan';
import { Money } from '../../../domain/value-objects/money';
import { PlanDurationMonths } from '../../../domain/value-objects/plan-duration-months';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { PlanName } from '../../../domain/value-objects/plan-name';
import { PlanEntity } from '../entities/plan.entity';
import { PlanOrmRepository } from './plan.orm-repository';

const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

function makeOrmEntity(): PlanEntity {
  const e = new PlanEntity();
  e.id = PLAN_UUID;
  e.name = 'Pro';
  e.durationMonths = 1;
  e.price = 99000;
  e.isActive = true;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-01');
  return e;
}

const mockTypeOrmRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<Repository<PlanEntity>>;

describe('PlanOrmRepository', () => {
  let repo: PlanOrmRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PlanOrmRepository(mockTypeOrmRepo);
  });

  describe('findById()', () => {
    it('should return null when not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repo.findById(new PlanId(PLAN_UUID));
      expect(result).toBeNull();
    });

    it('should return a Plan domain object when found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(makeOrmEntity());
      const result = await repo.findById(new PlanId(PLAN_UUID));
      expect(result).toBeInstanceOf(Plan);
      expect(result?.planId.value).toBe(PLAN_UUID);
    });

    it('should call findOne with correct where clause', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      await repo.findById(new PlanId(PLAN_UUID));
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: PLAN_UUID },
      });
    });
  });

  describe('findAllActive()', () => {
    it('should return empty array when no active plans', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);
      const result = await repo.findAllActive();
      expect(result).toEqual([]);
    });

    it('should return array of Plan domain objects', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([
        makeOrmEntity(),
        makeOrmEntity(),
      ]);
      const result = await repo.findAllActive();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Plan);
    });

    it('should call find with isActive=true and pagination', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);
      await repo.findAllActive(5, 10);
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 5,
        take: 10,
        order: { price: 'ASC' },
      });
    });
  });

  describe('save()', () => {
    it('should call repository.save with ORM entity', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as any);
      const plan = Plan.create(
        new PlanName('Basic'),
        new PlanDurationMonths(3),
        new Money(200000),
      );
      await repo.save(plan);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);

      const savedArg = mockTypeOrmRepo.save.mock.calls[0][0] as PlanEntity;
      expect(savedArg.name).toBe('Basic');
    });
  });
});
