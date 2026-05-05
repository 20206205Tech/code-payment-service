import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MESSAGE_BROKER_PORT,
  type MessageBrokerPort,
} from '../../application/ports/messaging/message-broker.port';
import { OutboxEntity } from '../database/entities/outbox.entity';

interface SubscriptionPurchasedOutboxPayload {
  subscriptionId: string;
  userId: string;
  planId: string;
  startDate: string | number | Date;
  endDate: string | number | Date;
  version: number;
}

@Injectable()
export class OutboxRelayCron {
  private readonly logger = new Logger(OutboxRelayCron.name);

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepo: Repository<OutboxEntity>,
    @Inject(MESSAGE_BROKER_PORT)
    private readonly messageBroker: MessageBrokerPort,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxMessages() {
    // 1. Lấy ra các message đang chờ xử lý
    const pendingMessages = await this.outboxRepo.find({
      where: { status: 'PENDING' },
      take: 50,
      order: { createdAt: 'ASC' },
    });

    if (pendingMessages.length === 0) return;

    this.logger.debug(
      `📤 Outbox: Tìm thấy ${pendingMessages.length} tin nhắn đang chờ gửi.`,
    );

    // 2. Lặp và gửi từng message
    for (const msg of pendingMessages) {
      try {
        // Router định tuyến dựa theo Event Type
        switch (msg.eventType) {
          case 'SubscriptionPurchasedEvent': {
            const payload = msg.payload as SubscriptionPurchasedOutboxPayload;
            await this.messageBroker.publishSubscriptionPurchased({
              subscriptionId: payload.subscriptionId,
              userId: payload.userId,
              planId: payload.planId,
              startDate: new Date(payload.startDate),
              endDate: new Date(payload.endDate),
              version: payload.version,
            });

            break;
          }

          default:
            this.logger.warn(
              `Không tìm thấy handler cho event: ${msg.eventType}`,
            );
        }

        // 3. Đánh dấu đã gửi thành công
        msg.status = 'DONE';
        await this.outboxRepo.save(msg);
      } catch (error) {
        this.logger.error(`❌ Gửi message ID ${msg.id} thất bại:`, error);

        // Cập nhật thành FAILED để có thể debug hoặc có logic retry (thử lại) sau
        msg.status = 'FAILED';
        await this.outboxRepo.save(msg);
      }
    }
  }
}
