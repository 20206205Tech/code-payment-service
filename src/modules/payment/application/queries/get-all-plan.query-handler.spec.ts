/* eslint-disable @typescript-eslint/unbound-method */
import { GetAllPlanQueryHandler } from './get-all-plan.query-handler';
import { GetAllPlanQuery } from './get-all-plan.query';
import { Plan } from '../../domain/entities/plan';
import { Money } from '../../domain/value-objects/money';
import { PlanRepositoryPort } from '../ports/database/plan.repository.port';

function makeActivePlan(name: string, price: number): Plan {
  return Plan.create(name, 1, new Money(price), true);
}

const mockPlanRepo = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;

describe('GetAllPlanQueryHandler', () => {
  let handler: GetAllPlanQueryHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetAllPlanQueryHandler(mockPlanRepo);
  });

  it('should return empty array when no plans found', async () => {
    mockPlanRepo.findAllActive.mockResolvedValue([]);
    const result = await handler.execute(new GetAllPlanQuery());
    expect(result).toEqual([]);
  });

  it('should map Plan domain objects to PlanResponseItem DTOs', async () => {
    const plans = [
      makeActivePlan('Basic', 99000),
      makeActivePlan('Pro', 199000),
    ];
    mockPlanRepo.findAllActive.mockResolvedValue(plans);

    const result = await handler.execute(new GetAllPlanQuery(0, 10));

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: 'Basic',
      price: 99000,
      durationMonths: 1,
      isActive: true,
    });
    expect(result[1]).toMatchObject({
      name: 'Pro',
      price: 199000,
    });
  });

  it('should pass skip and limit to repository', async () => {
    mockPlanRepo.findAllActive.mockResolvedValue([]);
    await handler.execute(new GetAllPlanQuery(5, 20));
    expect(mockPlanRepo.findAllActive).toHaveBeenCalledWith(5, 20);
  });

  it('should include id field as UUID string', async () => {
    const plan = makeActivePlan('X', 1000);
    mockPlanRepo.findAllActive.mockResolvedValue([plan]);
    const result = await handler.execute(new GetAllPlanQuery());
    expect(result[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
