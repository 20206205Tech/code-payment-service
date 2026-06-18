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
    features: ['Sử dụng suy luận', 'Sử dụng voice', 'Xử lý tài liệu riêng'],
    durationMonths: 1,
    price: 10000,
    isActive: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'VIP 6',
    features: ['Sử dụng suy luận', 'Sử dụng voice', 'Xử lý tài liệu riêng'],
    durationMonths: 6,
    price: 60000,
    isActive: true,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'VIP 12',
    features: ['Sử dụng suy luận', 'Sử dụng voice', 'Xử lý tài liệu riêng'],
    durationMonths: 12,
    price: 120000,
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
      const count = await this.planRepository.count();

      if (count > 0) {
        this.logger.log(
          'Database đã có dữ liệu Plan. Bỏ qua quá trình Seeding.',
        );
        return;
      }

      this.logger.log(
        'Không tìm thấy Plan nào. Bắt đầu tự động tạo 3 gói VIP mặc định...',
      );

      const defaultPlans = DEFAULT_PLANS.map((plan) =>
        this.planRepository.create(plan),
      );

      await this.planRepository.save(defaultPlans);
      this.logger.log('Đã tạo thành công 3 gói VIP mặc định.');
    } catch (error) {
      this.logger.error('Failed to seed default plans.', error);
    }
  }
}
