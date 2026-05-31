import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Kafka } from 'kafkajs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { PaymentStatus } from '../../src/modules/payment/domain/value-objects/payment-status';
import { SubscriptionStatus } from '../../src/modules/payment/domain/value-objects/subscription-status';
import { OutboxRelayCron } from '../../src/modules/payment/infrastructure/cron/outbox-relay.cron';
import { OutboxEntity } from '../../src/modules/payment/infrastructure/database/entities/outbox.entity';
import { SubscriptionEntity } from '../../src/modules/payment/infrastructure/database/entities/subscription.entity';
import { TransactionEntity } from '../../src/modules/payment/infrastructure/database/entities/transaction.entity';
import {
  adminHeader,
  mainWithMockAuth,
  userHeader,
} from '../common/utils/main-with-mock-auth.util';

const TOPIC = 'prod-payment-events'; // ENVIRONMENT=test → không phải 'development'

interface SubscriptionPurchasedEventPayload {
  userId: string;
  subscriptionId: string;
  planId: string;
  version: number;
  periodStart: string;
  periodEnd: string;
}

function isSubscriptionPurchasedEventPayload(
  value: unknown,
): value is SubscriptionPurchasedEventPayload {
  if (typeof value !== 'object' || value === null) return false;

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.userId === 'string' &&
    typeof payload.subscriptionId === 'string' &&
    typeof payload.planId === 'string' &&
    typeof payload.version === 'number' &&
    typeof payload.periodStart === 'string' &&
    typeof payload.periodEnd === 'string'
  );
}

describe('ManualActivateTransactionController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let outboxRelayCron: OutboxRelayCron;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
    dataSource = app.get<DataSource>(getDataSourceToken());
    outboxRelayCron = app.get<OutboxRelayCron>(OutboxRelayCron);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /subscriptions/manual-activate/:id — trả 400 khi transaction không tồn tại', async () => {
    await request(app.getHttpServer())
      .post(
        '/code-payment-service/subscriptions/manual-activate/123e4567-e89b-42d3-a456-426614174999',
      )
      .set(adminHeader())
      .expect(400);
  });

  it('POST /subscriptions/manual-activate/:id — trả 403 khi không phải admin', async () => {
    await request(app.getHttpServer())
      .post('/code-payment-service/subscriptions/manual-activate/some-id')
      .set(userHeader())
      .expect(403);
  });

  it('POST /subscriptions/manual-activate/:id — kích hoạt thành công và publish SubscriptionPurchasedEvent lên Kafka', async () => {
    // ── 1. Tạo plan qua API ───────────────────────────────────────────────────
    const planRes = await request(app.getHttpServer())
      .post('/code-payment-service/plans')
      .set(adminHeader())
      .send({ name: 'Pro Plan', durationMonths: 1, price: 99000 })
      .expect(201);

    const planBody = planRes.body as { data: { id: string } };
    const planId = planBody.data.id;
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    // ── 2. Seed subscription + transaction PENDING vào DB ────────────────────
    const subscriptionId = randomUUID();
    const transactionId = randomUUID();

    await dataSource.getRepository(SubscriptionEntity).save({
      id: subscriptionId,
      userId,
      planId,
      periodStart: new Date(),
      periodEnd: new Date(),
      status: SubscriptionStatus.PENDING,
      version: 0,
    });

    await dataSource.getRepository(TransactionEntity).save({
      id: transactionId,
      userId,
      subscriptionId,
      planId,
      baseAmount: 99000,
      discountAmount: 0,
      finalAmount: 99000,
      paymentMethod: 'manual',
      transactionRef: `MANUAL-${transactionId}`,
      paymentStatus: PaymentStatus.PENDING,
      version: 0,
    });

    // ── 3. Setup Kafka consumer để bắt message ───────────────────────────────
    const kafka = new Kafka({
      clientId: 'e2e-test-consumer-payment',
      brokers: [process.env.KAFKA_BROKER!],
    });
    const consumer = kafka.consumer({
      groupId: `e2e-payment-group-${randomUUID()}`,
    });
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

    const receivedMessages: any[] = [];
    await consumer.run({
      eachMessage: ({ message }) => {
        if (!message.value) return;
        const parsed: unknown = JSON.parse(message.value.toString());
        if (
          isSubscriptionPurchasedEventPayload(parsed) &&
          parsed.userId === userId &&
          parsed.subscriptionId === subscriptionId
        ) {
          receivedMessages.push(parsed);
        }
      },
    });

    // ── 4. Gọi API manual-activate ───────────────────────────────────────────
    const activateRes = await request(app.getHttpServer())
      .post(
        `/code-payment-service/subscriptions/manual-activate/${transactionId}`,
      )
      .set(adminHeader())
      .expect(201);

    const activateBody = activateRes.body as {
      message: string;
      data: { transaction_id: string; subscription_id: string };
    };
    expect(activateBody.message).toContain('Đã kích hoạt thủ công giao dịch');
    expect(activateBody.data.transaction_id).toBe(transactionId);
    expect(activateBody.data.subscription_id).toBe(subscriptionId);

    // ── 5. Verify outbox SubscriptionPurchasedEvent được tạo ─────────────────
    const outbox = await dataSource.getRepository(OutboxEntity).findOne({
      where: {
        aggregateId: subscriptionId,
        eventType: 'SubscriptionPurchasedEvent',
      },
    });
    expect(outbox).not.toBeNull();
    expect(outbox!.status).toBe('PENDING');

    // ── 6. Trigger outbox relay → publish lên Kafka thật ─────────────────────
    await outboxRelayCron.processOutboxMessages();

    // ── 7. Chờ message đến Kafka (tối đa 10s) ────────────────────────────────
    const deadline = Date.now() + 10_000;
    while (receivedMessages.length === 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
    }
    await consumer.disconnect();

    // ── 8. Verify nội dung message ────────────────────────────────────────────
    expect(receivedMessages.length).toBeGreaterThanOrEqual(1);
    const msg = receivedMessages[0] as SubscriptionPurchasedEventPayload;
    expect(msg.userId).toBe(userId);
    expect(msg.subscriptionId).toBe(subscriptionId);
    expect(msg.planId).toBe(planId);
    expect(msg.version).toBeGreaterThanOrEqual(1);
    expect(msg.periodStart).toBeDefined();
    expect(msg.periodEnd).toBeDefined();

    // ── 9. Verify outbox DONE ─────────────────────────────────────────────────
    const updatedOutbox = await dataSource.getRepository(OutboxEntity).findOne({
      where: {
        aggregateId: subscriptionId,
        eventType: 'SubscriptionPurchasedEvent',
      },
    });
    expect(updatedOutbox!.status).toBe('DONE');

    // ── Cleanup ───────────────────────────────────────────────────────────────
    await dataSource
      .getRepository(TransactionEntity)
      .delete({ id: transactionId });
    await dataSource
      .getRepository(SubscriptionEntity)
      .delete({ id: subscriptionId });
    await dataSource
      .getRepository(OutboxEntity)
      .delete({ aggregateId: subscriptionId });
  });
});
