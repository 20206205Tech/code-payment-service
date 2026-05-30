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
  periodStart: string | number | Date;
  periodEnd: string | number | Date;
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

  @Cron(
    process.env.NODE_ENV === 'production'
      ? CronExpression.EVERY_5_SECONDS
      : CronExpression.EVERY_5_MINUTES,
  )
  async processOutboxMessages() {
    const pendingMessages = await this.outboxRepo.find({
      where: { status: 'PENDING' },
      take: 50,
      order: { createdAt: 'ASC' },
    });

    if (pendingMessages.length === 0) return;

    this.logger.debug(
      `📤 Outbox: Tìm thấy ${pendingMessages.length} tin nhắn đang chờ gửi.`,
    );

    for (const msg of pendingMessages) {
      try {
        switch (msg.eventType) {
          case 'SubscriptionPurchasedEvent': {
            const payload = msg.payload as SubscriptionPurchasedOutboxPayload;
            await this.messageBroker.publishSubscriptionPurchased({
              subscriptionId: payload.subscriptionId,
              userId: payload.userId,
              planId: payload.planId,
              periodStart: new Date(payload.periodStart),
              periodEnd: new Date(payload.periodEnd),
              version: payload.version,
            });

            break;
          }

          default:
            this.logger.warn(
              `Không tìm thấy handler cho event: ${msg.eventType}`,
            );
        }

        msg.status = 'DONE';
        await this.outboxRepo.save(msg);
      } catch (error) {
        this.logger.error(`❌ Gửi message ID ${msg.id} thất bại:`, error);

        msg.status = 'FAILED';
        await this.outboxRepo.save(msg);
      }
    }
  }
}
