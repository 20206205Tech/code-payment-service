import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { PlanEntity } from '../database/entities/plan.entity';

/**
 * Dọn dẹp các Plan đã bị archive (isActive = false) quá 30 ngày.
 * Chạy mỗi ngày lúc nửa đêm.
 */
@Injectable()
export class PlanCleanupCron {
  private readonly logger = new Logger(PlanCleanupCron.name);

  /** Số ngày giữ lại plan đã archive trước khi xóa vĩnh viễn */
  private static readonly RETAIN_DAYS = 30;

  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
  ) {}

  @Cron(
    process.env.ENVIRONMENT === 'production'
      ? CronExpression.EVERY_DAY_AT_MIDNIGHT
      : CronExpression.EVERY_5_MINUTES,
    // : CronExpression.EVERY_5_SECONDS,
  )
  async handleCleanup(): Promise<void> {
    this.logger.log(
      'Bắt đầu dọn dẹp các Plan đã archive (isActive = false)...',
    );

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - PlanCleanupCron.RETAIN_DAYS);

      const result = await this.planRepo.delete({
        isActive: false,
        updatedAt: LessThan(cutoffDate),
      });

      this.logger.log(
        `Dọn dẹp hoàn tất: Đã xóa ${result.affected ?? 0} plan(s) đã archive quá ${PlanCleanupCron.RETAIN_DAYS} ngày.`,
      );
    } catch (error) {
      this.logger.error('❌ Lỗi trong quá trình dọn dẹp Plan:', error);
    }
  }
}
