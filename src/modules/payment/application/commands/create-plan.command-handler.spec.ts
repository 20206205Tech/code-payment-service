/* eslint-disable @typescript-eslint/unbound-method */
import { PlanRepositoryPort } from '../../application/ports/database/plan.repository.port';
import { Plan } from '../../domain/entities/plan';
import { CreatePlanCommand } from './create-plan.command';
import { CreatePlanCommandHandler } from './create-plan.command-handler';

const mockPlanRepository = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;

describe('CreatePlanCommandHandler', () => {
  let handler: CreatePlanCommandHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CreatePlanCommandHandler(mockPlanRepository);
  });

  it('should create a Plan and save it', async () => {
    mockPlanRepository.save.mockResolvedValue(undefined);

    const command = new CreatePlanCommand('ProPlan', 1, 99000, true);
    const result = await handler.execute(command);

    expect(result).toBeInstanceOf(Plan);
    expect(result.name.value).toBe('ProPlan');
    expect(result.durationMonths.value).toBe(1);
    expect(result.price.amount).toBe(99000);
    expect(result.isActive).toBe(true);
    expect(mockPlanRepository.save).toHaveBeenCalledTimes(1);
    expect(mockPlanRepository.save).toHaveBeenCalledWith(result);
  });

  it('should pass the Plan to repository.save()', async () => {
    mockPlanRepository.save.mockResolvedValue(undefined);
    const command = new CreatePlanCommand('BasicPlan', 3, 200000, true);
    const result = await handler.execute(command);

    expect(mockPlanRepository.save).toHaveBeenCalledWith(result);
    expect(result.price.amount).toBe(200000);
  });

  it('should propagate errors from the repository', async () => {
    mockPlanRepository.save.mockRejectedValue(new Error('DB error'));
    await expect(
      handler.execute(new CreatePlanCommand('BadPlan', 1, 1, true)),
    ).rejects.toThrow('DB error');
  });
});
