import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';

const DEFAULT_PLANS: Array<
  Pick<
    PlanEntity,
    'id' | 'name' | 'features' | 'durationMonths' | 'price' | 'isActive'
  >
> = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'VIP 1',
    features: ['Su dung suy luan', 'Su dung voice', 'Xu ly tai lieu rieng'],
    durationMonths: 1,
    price: 100000,
    isActive: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'VIP 6',
    features: ['Su dung suy luan', 'Su dung voice', 'Xu ly tai lieu rieng'],
    durationMonths: 6,
    price: 550000,
    isActive: true,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'VIP 12',
    features: ['Su dung suy luan', 'Su dung voice', 'Xu ly tai lieu rieng'],
    durationMonths: 12,
    price: 1000000,
    isActive: true,
  },
];

@Injectable()
export class PlanSeeder implements OnModuleInit {
  private readonly logger = new Logger(PlanSeeder.name);

  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialPlans();
  }

  private async seedInitialPlans(): Promise<void> {
    try {
      const plansToCreate: PlanEntity[] = [];

      for (const defaultPlan of DEFAULT_PLANS) {
        const existingPlan = await this.planRepository.findOne({
          where: [{ id: defaultPlan.id }, { name: defaultPlan.name }],
        });

        if (!existingPlan) {
          plansToCreate.push(this.planRepository.create(defaultPlan));
        }
      }

      if (plansToCreate.length === 0) {
        this.logger.log('Default plans already exist. Skip plan seeding.');
        return;
      }

      await this.planRepository.save(plansToCreate);
      this.logger.log(`Seeded ${plansToCreate.length} default plan(s).`);
    } catch (error) {
      this.logger.error('Failed to seed default plans.', error);
    }
  }
}
