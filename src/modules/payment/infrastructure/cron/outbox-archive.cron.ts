import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, LessThan } from 'typeorm';
import { OutboxArchiveEntity } from '../database/entities/outbox-archive.entity';
import { OutboxEntity } from '../database/entities/outbox.entity';

@Injectable()
export class OutboxArchiveCron {
  private readonly logger = new Logger(OutboxArchiveCron.name);

  /** Giữ message trong bảng chính trước khi chuyển sang archive */
  private static readonly RETAIN_DAYS = 7;

  private static readonly BATCH_SIZE = 1000;

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @Cron(
    process.env.ENVIRONMENT === 'production'
      ? CronExpression.EVERY_DAY_AT_MIDNIGHT
      : CronExpression.EVERY_5_MINUTES,
    // : CronExpression.EVERY_5_SECONDS,
  )
  async handleArchiveOutbox(): Promise<void> {
    this.logger.log('Bắt đầu quá trình archive outbox messages...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - OutboxArchiveCron.RETAIN_DAYS);

    try {
      let totalArchived = 0;

      while (true) {
        const batchCount = await this.archiveBatch(cutoffDate);
        if (batchCount === 0) {
          break;
        }
        totalArchived += batchCount;
        if (batchCount < OutboxArchiveCron.BATCH_SIZE) {
          break;
        }
      }

      if (totalArchived === 0) {
        this.logger.log('Không có outbox message nào cần archive hôm nay.');
        return;
      }

      this.logger.log(
        `Đã archive thành công ${totalArchived} outbox message(s).`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Lỗi trong quá trình archive outbox messages:',
        error,
      );
    }
  }

  private async archiveBatch(cutoffDate: Date): Promise<number> {
    return this.entityManager.transaction(async (manager) => {
      const messagesToArchive = await manager.find(OutboxEntity, {
        where: [
          { status: 'DONE', processedAt: LessThan(cutoffDate) },
          { status: 'DEAD_LETTER', processedAt: LessThan(cutoffDate) },
        ],
        order: { processedAt: 'ASC' },
        take: OutboxArchiveCron.BATCH_SIZE,
      });

      if (messagesToArchive.length === 0) {
        return 0;
      }

      const archivedAt = new Date();
      const archiveEntities = messagesToArchive.map((msg) => {
        const archive = new OutboxArchiveEntity();
        archive.id = msg.id;
        archive.aggregateType = msg.aggregateType;
        archive.aggregateId = msg.aggregateId;
        archive.eventType = msg.eventType;
        archive.payload = msg.payload;
        archive.status = msg.status;
        archive.retryCount = msg.retryCount;
        archive.createdAt = msg.createdAt;
        archive.processedAt = msg.processedAt;
        archive.archivedAt = archivedAt;
        return archive;
      });

      await manager.save(archiveEntities);

      const idsToRemove = messagesToArchive.map((m) => m.id);
      await manager.delete(OutboxEntity, idsToRemove);

      return messagesToArchive.length;
    });
  }
}
