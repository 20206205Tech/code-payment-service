import { Repository } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';
import { PlanSeeder } from './plan.seeder';

describe('PlanSeeder', () => {
  let planRepository: jest.Mocked<
    Pick<Repository<PlanEntity>, 'count' | 'create' | 'save'>
  >;
  let seeder: PlanSeeder;

  beforeEach(() => {
    planRepository = {
      count: jest.fn(),
      create: jest.fn((plan) => plan as PlanEntity),
      save: jest.fn(),
    };

    seeder = new PlanSeeder(
      planRepository as unknown as Repository<PlanEntity>,
    );
  });

  it('creates default plans when the plan table is empty', async () => {
    planRepository.count.mockResolvedValue(0);

    await seeder.onModuleInit();

    expect(planRepository.count).toHaveBeenCalledTimes(1);
    expect(planRepository.create).toHaveBeenCalledTimes(3);
    expect(planRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'VIP 1', durationMonths: 1 }),
        expect.objectContaining({ name: 'VIP 6', durationMonths: 6 }),
        expect.objectContaining({ name: 'VIP 12', durationMonths: 12 }),
      ]),
    );
  });

  it('does not create plans when the plan table already has data', async () => {
    planRepository.count.mockResolvedValue(1);

    await seeder.onModuleInit();

    expect(planRepository.count).toHaveBeenCalledTimes(1);
    expect(planRepository.create).not.toHaveBeenCalled();
    expect(planRepository.save).not.toHaveBeenCalled();
  });
});
