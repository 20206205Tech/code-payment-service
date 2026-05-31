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
  let findByIdMock: jest.MockedFunction<PlanOrmRepository['findById']>;
  let findAllActiveMock: jest.MockedFunction<
    PlanOrmRepository['findAllActive']
  >;
  let saveMock: jest.MockedFunction<PlanOrmRepository['save']>;
  let cache: jest.Mocked<CachePort>;
  let cacheGetMock: jest.MockedFunction<CachePort['get']>;
  let cacheSetMock: jest.MockedFunction<CachePort['set']>;
  let cacheDelByPatternMock: jest.MockedFunction<CachePort['delByPattern']>;
  let repository: CachedPlanRepository;

  beforeEach(() => {
    findByIdMock = jest.fn();
    findAllActiveMock = jest.fn();
    saveMock = jest.fn();
    cacheGetMock = jest.fn();
    cacheSetMock = jest.fn();
    cacheDelByPatternMock = jest.fn();

    planRepository = {
      findById: findByIdMock,
      findAllActive: findAllActiveMock,
      save: saveMock,
    } as unknown as jest.Mocked<PlanOrmRepository>;

    cache = {
      get: cacheGetMock,
      set: cacheSetMock,
      del: jest.fn(),
      delByPattern: cacheDelByPatternMock,
    };

    repository = new CachedPlanRepository(planRepository, cache);
  });

  describe('findById()', () => {
    it('should return cached plan and skip database on hit', async () => {
      const plan = createPlan();
      cacheGetMock.mockResolvedValue(makeCachedPlan(plan));

      const result = await repository.findById(new PlanId(PLAN_UUID));

      expect(result?.planId.value).toBe(plan.planId.value);
      expect(result?.features).toEqual(plan.features);
      expect(findByIdMock).not.toHaveBeenCalled();
    });

    it('should read from database and populate cache on miss', async () => {
      const plan = createPlan();
      planRepository.findById.mockResolvedValue(plan);
      cacheGetMock.mockResolvedValue(null);

      const result = await repository.findById(new PlanId(PLAN_UUID));

      expect(result).toBe(plan);
      expect(findByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({ value: PLAN_UUID }),
      );
      expect(cacheSetMock).toHaveBeenCalledWith(
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
      cacheGetMock.mockResolvedValue([makeCachedPlan(plan)]);

      const result = await repository.findAllActive(0, 100);

      expect(result).toHaveLength(1);
      expect(result[0].planId.value).toBe(plan.planId.value);
      expect(findAllActiveMock).not.toHaveBeenCalled();
    });

    it('should read from database and cache the result on miss', async () => {
      const plan = createPlan('DB Plan');
      planRepository.findAllActive.mockResolvedValue([plan]);
      cacheGetMock.mockResolvedValue(null);

      const result = await repository.findAllActive(0, 100);

      expect(result).toEqual([plan]);
      expect(findAllActiveMock).toHaveBeenCalledWith(0, 100);
      expect(cacheSetMock).toHaveBeenCalledWith(
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

      expect(saveMock).toHaveBeenCalledWith(plan);
      expect(cacheDelByPatternMock).toHaveBeenCalledWith('payment:plans:*');
    });
  });
});
