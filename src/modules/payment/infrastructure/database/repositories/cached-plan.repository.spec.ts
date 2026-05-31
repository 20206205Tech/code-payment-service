import type { CachePort } from '../../../application/ports/cache.port';
import { Plan } from '../../../domain/entities/plan';
import { Money } from '../../../domain/value-objects/money';
import { PlanDurationMonths } from '../../../domain/value-objects/plan-duration-months';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { PlanName } from '../../../domain/value-objects/plan-name';
import { CachedPlanRepository } from './cached-plan.repository';
import { PlanOrmRepository } from './plan.orm-repository';

const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

function createPlan(name = 'Pro'): Plan {
  return Plan.create(
    new PlanName(name),
    new PlanDurationMonths(1),
    new Money(99000),
    true,
    ['Feature A', 'Feature B'],
  );
}

function makeCachedPlan(plan: Plan) {
  return {
    id: plan.planId.value,
    name: plan.name.value,
    features: plan.features,
    durationMonths: plan.durationMonths.value,
    price: plan.price.amount,
    isActive: plan.isActive,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    version: plan.version.value,
  };
}

describe('CachedPlanRepository', () => {
  let planRepository: jest.Mocked<PlanOrmRepository>;
  let cache: jest.Mocked<CachePort>;
  let repository: CachedPlanRepository;

  beforeEach(() => {
    planRepository = {
      findById: jest.fn(),
      findAllActive: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<PlanOrmRepository>;

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    } as unknown as jest.Mocked<CachePort>;

    repository = new CachedPlanRepository(planRepository, cache);
  });

  describe('findById()', () => {
    it('should return cached plan and skip database on hit', async () => {
      const plan = createPlan();
      cache.get.mockResolvedValue(makeCachedPlan(plan));

      const result = await repository.findById(new PlanId(PLAN_UUID));

      expect(result?.planId.value).toBe(plan.planId.value);
      expect(result?.features).toEqual(plan.features);
      expect(planRepository.findById).not.toHaveBeenCalled();
    });

    it('should read from database and populate cache on miss', async () => {
      const plan = createPlan();
      planRepository.findById.mockResolvedValue(plan);
      cache.get.mockResolvedValue(null);

      const result = await repository.findById(new PlanId(PLAN_UUID));

      expect(result).toBe(plan);
      expect(planRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: PLAN_UUID }),
      );
      expect(cache.set).toHaveBeenCalledWith(
        `payment:plans:by-id:${PLAN_UUID}`,
        expect.objectContaining({
          id: plan.planId.value,
          features: plan.features,
        }),
        3600,
      );
    });
  });

  describe('findAllActive()', () => {
    it('should return cached plans and skip database on hit', async () => {
      const plan = createPlan('Cached');
      cache.get.mockResolvedValue([makeCachedPlan(plan)]);

      const result = await repository.findAllActive(0, 100);

      expect(result).toHaveLength(1);
      expect(result[0].planId.value).toBe(plan.planId.value);
      expect(planRepository.findAllActive).not.toHaveBeenCalled();
    });

    it('should read from database and cache the result on miss', async () => {
      const plan = createPlan('DB Plan');
      planRepository.findAllActive.mockResolvedValue([plan]);
      cache.get.mockResolvedValue(null);

      const result = await repository.findAllActive(0, 100);

      expect(result).toEqual([plan]);
      expect(planRepository.findAllActive).toHaveBeenCalledWith(0, 100);
      expect(cache.set).toHaveBeenCalledWith(
        'payment:plans:active:0:100',
        [expect.objectContaining({ id: plan.planId.value })],
        3600,
      );
    });
  });

  describe('save()', () => {
    it('should save plan and invalidate cache patterns', async () => {
      const plan = createPlan();

      await repository.save(plan);

      expect(planRepository.save).toHaveBeenCalledWith(plan);
      expect(cache.delByPattern).toHaveBeenCalledWith('payment:plans:*');
    });
  });
});
