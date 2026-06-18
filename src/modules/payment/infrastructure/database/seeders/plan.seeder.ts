import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';

@Injectable()
export class PlanSeeder implements OnModuleInit {
  private readonly logger = new Logger(PlanSeeder.name);

  // Inject trực tiếp TypeORM Entity để thao tác với database cho quá trình seed
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  async onModuleInit() {
    await this.seedInitialPlans();
  }

  private async seedInitialPlans() {
    try {
      // 1. Kiểm tra xem database đã có dữ liệu Plan nào chưa
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

      // 2. Tạo mảng dữ liệu cho 3 gói (cập nhật các field theo đúng thiết kế của PlanEntity)
      const defaultPlans = [
        this.planRepository.create({
          name: 'VIP 1',
          durationMonths: 1,
          price: 100000, // Sửa lại giá tiền cho phù hợp với logic của bạn
          isActive: true,
        }),
        this.planRepository.create({
          name: 'VIP 6',
          durationMonths: 6,
          price: 550000,
          isActive: true,
        }),
        this.planRepository.create({
          name: 'VIP 12',
          durationMonths: 12,
          price: 1000000,
          isActive: true,
        }),
      ];

      // 3. Lưu vào cơ sở dữ liệu
      await this.planRepository.save(defaultPlans);
      this.logger.log('Đã tạo thành công 3 gói VIP (1, 6, 12 tháng).');
    } catch (error) {
      this.logger.error('Lỗi khi thực hiện seed dữ liệu Plan:', error);
    }
  }
}
