import { Repository } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';
import { PlanSeeder } from './plan.seeder';

describe('PlanSeeder', () => {
  let planRepository: jest.Mocked<
    Pick<Repository<PlanEntity>, 'findOne' | 'create' | 'save'>
  >;
  let seeder: PlanSeeder;

  beforeEach(() => {
    planRepository = {
      findOne: jest.fn(),
      create: jest.fn((plan) => plan as PlanEntity),
      save: jest.fn(),
    };

    seeder = new PlanSeeder(
      planRepository as unknown as Repository<PlanEntity>,
    );
  });

  it('creates missing default plans on module init', async () => {
    planRepository.findOne.mockResolvedValue(null);

    await seeder.onModuleInit();

    expect(planRepository.findOne).toHaveBeenCalledTimes(3);
    expect(planRepository.create).toHaveBeenCalledTimes(3);
    expect(planRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'VIP 1', durationMonths: 1 }),
        expect.objectContaining({ name: 'VIP 6', durationMonths: 6 }),
        expect.objectContaining({ name: 'VIP 12', durationMonths: 12 }),
      ]),
    );
  });

  it('does not create plans that already exist', async () => {
    planRepository.findOne.mockResolvedValue({
      id: 'existing-id',
    } as PlanEntity);

    await seeder.onModuleInit();

    expect(planRepository.create).not.toHaveBeenCalled();
    expect(planRepository.save).not.toHaveBeenCalled();
  });
});
