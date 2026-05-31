import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MESSAGE_BROKER_PORT,
  type MessageBrokerPort,
} from '../../application/ports/messaging/message-broker.port';
import { OutboxEntity } from '../database/entities/outbox.entity';
import { TelegramAlertService } from '../messaging/telegram-alert.service';

interface SubscriptionPurchasedOutboxPayload {
  subscriptionId: string;
  userId: string;
  planId: string;
  periodStart: string | number | Date;
  periodEnd: string | number | Date;
  version: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSubscriptionPurchasedOutboxPayload(
  payload: unknown,
): payload is SubscriptionPurchasedOutboxPayload {
  if (!isRecord(payload)) return false;

  const { subscriptionId, userId, planId, periodStart, periodEnd, version } =
    payload;

  const isValidPeriod =
    typeof periodStart === 'string' ||
    typeof periodStart === 'number' ||
    periodStart instanceof Date;

  const isValidEndPeriod =
    typeof periodEnd === 'string' ||
    typeof periodEnd === 'number' ||
    periodEnd instanceof Date;

  return (
    typeof subscriptionId === 'string' &&
    typeof userId === 'string' &&
    typeof planId === 'string' &&
    isValidPeriod &&
    isValidEndPeriod &&
    typeof version === 'number' &&
    Number.isFinite(version)
  );
}

@Injectable()
export class OutboxRelayCron {
  private readonly logger = new Logger(OutboxRelayCron.name);

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepo: Repository<OutboxEntity>,
    @Inject(MESSAGE_BROKER_PORT)
    private readonly messageBroker: MessageBrokerPort,
    private readonly telegramAlert: TelegramAlertService,
  ) {}

  @Cron(
    process.env.NODE_ENV === 'production'
      ? CronExpression.EVERY_5_SECONDS
      : CronExpression.EVERY_5_MINUTES,
  )
  async processOutboxMessages() {
    const pendingMessages = await this.loadPendingMessages();
    if (pendingMessages.length === 0) return;

    this.logger.debug(
      `📤 Outbox: Tìm thấy ${pendingMessages.length} tin nhắn đang chờ gửi.`,
    );

    for (const msg of pendingMessages) {
      await this.processOutboxMessage(msg);
    }
  }

  private async loadPendingMessages() {
    const maxRetry = 10;
    const retryDelayMinutes = 5;

    return this.outboxRepo
      .createQueryBuilder('outbox')
      .where('outbox.status = :pending', { pending: 'PENDING' })
      .orWhere(
        'outbox.status = :failed AND outbox.retryCount < :maxRetry AND outbox.processedAt < :retryAfter',
        {
          failed: 'FAILED',
          maxRetry,
          retryAfter: new Date(Date.now() - retryDelayMinutes * 60 * 1000),
        },
      )
      .orderBy('outbox.createdAt', 'ASC')
      .take(50)
      .getMany();
  }

  private async processOutboxMessage(msg: OutboxEntity): Promise<void> {
    try {
      await this.publishOutboxMessage(msg);
      await this.markMessageDone(msg);
    } catch (error) {
      await this.handleOutboxMessageFailure(msg, error);
    }
  }

  private async publishOutboxMessage(msg: OutboxEntity): Promise<void> {
    switch (msg.eventType) {
      case 'SubscriptionPurchasedEvent':
        await this.publishSubscriptionPurchasedEvent(msg);
        return;

      default:
        this.logger.warn(`Không tìm thấy handler cho event: ${msg.eventType}`);
    }
  }

  private async publishSubscriptionPurchasedEvent(
    msg: OutboxEntity,
  ): Promise<void> {
    if (!isSubscriptionPurchasedOutboxPayload(msg.payload)) {
      throw new Error(
        `Invalid payload for event ${msg.eventType} in outbox message ${msg.id}`,
      );
    }

    await this.messageBroker.publishSubscriptionPurchased({
      subscriptionId: msg.payload.subscriptionId,
      userId: msg.payload.userId,
      planId: msg.payload.planId,
      periodStart: new Date(msg.payload.periodStart),
      periodEnd: new Date(msg.payload.periodEnd),
      version: msg.payload.version,
    });
  }

  private async markMessageDone(msg: OutboxEntity): Promise<void> {
    msg.status = 'DONE';
    msg.processedAt = new Date();
    await this.outboxRepo.save(msg);
  }

  private async handleOutboxMessageFailure(
    msg: OutboxEntity,
    error: unknown,
  ): Promise<void> {
    const maxRetry = 10;

    this.logger.error(
      `❌ Gửi message ID ${msg.id} thất bại (retry ${msg.retryCount + 1}/${maxRetry}):`,
      error,
    );

    msg.retryCount = (msg.retryCount || 0) + 1;
    msg.processedAt = new Date();

    if (msg.retryCount >= maxRetry) {
      msg.status = 'DEAD_LETTER';

      this.logger.error(
        `💀 Message ${msg.id} đã vượt quá số lần retry, đánh dấu DEAD_LETTER`,
      );

      await this.sendDeadLetterAlert(msg, error, maxRetry);
    } else {
      msg.status = 'FAILED'; // Sẽ được retry sau
    }

    await this.outboxRepo.save(msg);
  }

  private async sendDeadLetterAlert(
    msg: OutboxEntity,
    error: unknown,
    maxRetry: number,
  ): Promise<void> {
    try {
      const payload = isRecord(msg.payload) ? msg.payload : undefined;

      await this.telegramAlert.sendDLQAlert({
        event: msg.eventType,
        subscriptionId:
          typeof payload?.subscriptionId === 'string'
            ? payload.subscriptionId
            : undefined,
        userId:
          typeof payload?.userId === 'string' ? payload.userId : undefined,
        version:
          typeof payload?.version === 'number' ? payload.version : undefined,
        totalAttempts: msg.retryCount,
        maxRetries: maxRetry,
        errorMessage: String(error),
        payload: msg.payload,
      });
    } catch (alertError) {
      this.logger.error(`Failed to send Telegram alert: ${alertError}`);
    }
  }
}
