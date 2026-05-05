import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';
import { GetDetailPlanQueryHandler } from './get-detail-plan.query-handler';
import { GetDetailPlanQuery } from './get-detail-plan.query';
import { Plan } from '../../domain/entities/plan';
import { Money } from '../../domain/value-objects/money';
import { PlanRepositoryPort } from '../ports/database/plan.repository.port';

const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

const mockPlanRepo = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;

describe('GetDetailPlanQueryHandler', () => {
  let handler: GetDetailPlanQueryHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetDetailPlanQueryHandler(mockPlanRepo);
  });

  it('should throw PlanNotFoundException when plan not found', async () => {
    mockPlanRepo.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new GetDetailPlanQuery(PLAN_UUID)),
    ).rejects.toThrow(PlanNotFoundException);
  });

  it('should return PlanResponseItem when plan found', async () => {
    const plan = Plan.create('Basic', 12, new Money(500000), true);
    mockPlanRepo.findById.mockResolvedValue(plan);

    const result = await handler.execute(new GetDetailPlanQuery(PLAN_UUID));

    expect(result.name).toBe('Basic');
    expect(result.price).toBe(500000);
    expect(result.durationMonths).toBe(12);
    expect(result.isActive).toBe(true);
  });

  it('should call findById with correct PlanId', async () => {
    const plan = Plan.create('X', 1, new Money(1), true);
    mockPlanRepo.findById.mockResolvedValue(plan);

    await handler.execute(new GetDetailPlanQuery(PLAN_UUID));

    const arg = mockPlanRepo.findById.mock.calls[0][0];

    expect(arg.value).toBe(PLAN_UUID);
  });
});
