import { Plan } from '../../domain/entities/plan';
import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';
import { Money } from '../../domain/value-objects/money';
import { PlanDurationMonths } from '../../domain/value-objects/plan-duration-months';
import { PlanName } from '../../domain/value-objects/plan-name';
import { PlanRepositoryPort } from '../ports/database/plan.repository.port';
import { GetDetailPlanQuery } from './get-detail-plan.query';
import { GetDetailPlanQueryHandler } from './get-detail-plan.query-handler';

const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

const mockPlanRepo = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} satisfies Pick<PlanRepositoryPort, 'findById'>;

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
    const plan = Plan.create(
      new PlanName('Basic'),
      new PlanDurationMonths(12),
      new Money(500000),
      true,
    );
    mockPlanRepo.findById.mockResolvedValue(plan);

    const result = await handler.execute(new GetDetailPlanQuery(PLAN_UUID));

    expect(result.name).toBe('Basic');
    expect(result.price).toBe(500000);
    expect(result.durationMonths).toBe(12);
    expect(result.isActive).toBe(true);
  });

  it('should call findById with correct PlanId', async () => {
    const plan = Plan.create(
      new PlanName('Xxx'),
      new PlanDurationMonths(1),
      new Money(1),
      true,
    );
    mockPlanRepo.findById.mockResolvedValue(plan);

    await handler.execute(new GetDetailPlanQuery(PLAN_UUID));

    expect(mockPlanRepo.findById).toHaveBeenCalledWith(
      expect.objectContaining({ value: PLAN_UUID }),
    );
  });
});
