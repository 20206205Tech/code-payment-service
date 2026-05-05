/* eslint-disable @typescript-eslint/unbound-method */
import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';
import { ArchivePlanCommandHandler } from './archive-plan.command-handler';
import { ArchivePlanCommand } from './archive-plan.command';
import { Plan } from '../../domain/entities/plan';
import { Money } from '../../domain/value-objects/money';

import { PlanRepositoryPort } from '../../application/ports/database/plan.repository.port';

const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

const mockPlanRepository = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;

function makeActivePlan(): Plan {
  return Plan.create('Pro', 1, new Money(99000), true);
}

describe('ArchivePlanCommandHandler', () => {
  let handler: ArchivePlanCommandHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new ArchivePlanCommandHandler(mockPlanRepository);
  });

  it('should deactivate and save the plan when found', async () => {
    const plan = makeActivePlan();
    mockPlanRepository.findById.mockResolvedValue(plan);
    mockPlanRepository.save.mockResolvedValue(undefined);

    await handler.execute(new ArchivePlanCommand(PLAN_UUID));

    expect(plan.isActive).toBe(false);
    expect(mockPlanRepository.save).toHaveBeenCalledWith(plan);
  });

  it('should throw PlanNotFoundException when plan not found', async () => {
    mockPlanRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ArchivePlanCommand(PLAN_UUID)),
    ).rejects.toThrow(PlanNotFoundException);
  });

  it('should throw PlanNotFoundException with correct message', async () => {
    mockPlanRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ArchivePlanCommand(PLAN_UUID)),
    ).rejects.toThrow(`Gói dịch vụ với ID "${PLAN_UUID}" không tồn tại.`);
  });

  it('should call findById with the correct PlanId', async () => {
    const plan = makeActivePlan();
    mockPlanRepository.findById.mockResolvedValue(plan);
    mockPlanRepository.save.mockResolvedValue(undefined);

    await handler.execute(new ArchivePlanCommand(PLAN_UUID));

    const calledWith = mockPlanRepository.findById.mock.calls[0][0];

    expect(calledWith.value).toBe(PLAN_UUID);
  });
});
