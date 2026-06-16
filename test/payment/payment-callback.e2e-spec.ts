import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Kafka } from 'kafkajs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { EMAIL_SENDER_PORT } from '../../src/modules/payment/application/ports/email/email-sender.port';
import { PAYMENT_GATEWAY_PORT } from '../../src/modules/payment/application/ports/payment/payment-gateway.port';
import { USER_PROFILE_PORT } from '../../src/modules/payment/application/ports/service/user-profile.port';
import { PaymentTimeoutProcessor } from '../../src/modules/payment/application/processors/payment-timeout.processor';
import { PaymentStatus } from '../../src/modules/payment/domain/value-objects/payment-status';
import { SubscriptionStatus } from '../../src/modules/payment/domain/value-objects/subscription-status';
import { OutboxRelayCron } from '../../src/modules/payment/infrastructure/cron/outbox-relay.cron';
import { OutboxEntity } from '../../src/modules/payment/infrastructure/database/entities/outbox.entity';
import { PlanEntity } from '../../src/modules/payment/infrastructure/database/entities/plan.entity';
import { SubscriptionEntity } from '../../src/modules/payment/infrastructure/database/entities/subscription.entity';
import { TransactionEntity } from '../../src/modules/payment/infrastructure/database/entities/transaction.entity';
import { httpServer } from '../common/utils/http-server.util';

const TOPIC = 'prod-payment-events';

function toText(value: unknown, fallback = ''): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  return fallback;
}

async function mainWithMockPaymentGateway(
  module: any,
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [module],
  })
    .overrideProvider(PAYMENT_GATEWAY_PORT)
    .useValue({
      createPaymentUrl: jest.fn(),
      verifyIpn: jest
        .fn()
        .mockImplementation((data: Record<string, unknown>) => {
          const amount = data.vnp_Amount
            ? Number(data.vnp_Amount) / 100
            : Number(data.amount ?? 99000);

          return Promise.resolve({
            isValid: true,
            isSuccess: true,
            txnRef: toText(data.vnp_TxnRef ?? data.txnRef ?? data.orderId),
            amount,
            providerTransId: toText(
              data.vnp_TransactionNo ?? data.transId ?? data.zp_trans_id,
              'BANK-001',
            ),
            message: 'Success',
          });
        }),
    })
    .overrideProvider(EMAIL_SENDER_PORT)
    .useValue({
      sendPaymentSuccessEmail: jest.fn().mockResolvedValue(undefined),
      sendSubscriptionExpirationWarningEmail: jest
        .fn()
        .mockResolvedValue(undefined),
      sendSubscriptionExpiredEmail: jest.fn().mockResolvedValue(undefined),
    })
    .overrideProvider(USER_PROFILE_PORT)
    .useValue({
      getProfile: jest.fn().mockResolvedValue({ fullName: 'Test User' }),
    })
    .overrideProvider(PaymentTimeoutProcessor)
    .useValue({})
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('code-payment-service');
  await app.init();

  (globalThis as typeof globalThis & { app?: INestApplication }).app = app;
  return app;
}

describe('PaymentCallbackController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let outboxRelayCron: OutboxRelayCron;

  beforeAll(async () => {
    app = await mainWithMockPaymentGateway(AppModule);
    dataSource = app.get<DataSource>(getDataSourceToken());
    outboxRelayCron = app.get<OutboxRelayCron>(OutboxRelayCron);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET/POST /subscriptions/payment-callback/:provider', () => {
    it('should handle VNPay callback (GET)', async () => {
      const response = await request(httpServer(app))
        .get('/code-payment-service/subscriptions/payment-callback/vnpay')
        .query({ vnp_ResponseCode: '00', vnp_TxnRef: '123' })
        .expect(200);

      const body = response.body as { RspCode: string };
      expect(body.RspCode).toBeDefined();
    });

    it('should handle MoMo callback (POST)', async () => {
      const response = await request(httpServer(app))
        .post('/code-payment-service/subscriptions/payment-callback/momo')
        .send({ resultCode: 0, orderId: '456' })
        .expect(200);

      const body = response.body as { resultCode: number };
      expect(body.resultCode).toBeDefined();
    });

    it('should publish Kafka message after successful VNPay callback', async () => {
      const planId = randomUUID();
      const subscriptionId = randomUUID();
      const transactionId = randomUUID();
      const txnRef = `VNPAY-${transactionId}`;
      const userId = '123e4567-e89b-12d3-a456-426614174001';

      await dataSource.getRepository(PlanEntity).save({
        id: planId,
        name: 'Kafka Plan',
        durationMonths: 1,
        price: 99000,
        isActive: true,
        version: 0,
      });

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
        paymentMethod: 'vnpay',
        transactionRef: txnRef,
        paymentStatus: PaymentStatus.PENDING,
        providerTransactionId: null,
        paymentMetadata: null,
        paidAt: null,
        version: 0,
      });

      const kafka = new Kafka({
        clientId: 'e2e-test-consumer-payment-callback',
        brokers: [process.env.KAFKA_BROKER!],
        connectionTimeout: 10000,
        retry: {
          initialRetryTime: 300,
          retries: 10,
        },
      });
      const consumer = kafka.consumer({
        groupId: `e2e-payment-callback-group-${randomUUID()}`,
        retry: {
          initialRetryTime: 300,
          retries: 10,
        },
      });
      await consumer.connect();
      await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

      const receivedMessages: unknown[] = [];
      await consumer.run({
        eachMessage: ({ message }) => {
          if (!message.value) return;
          receivedMessages.push(JSON.parse(message.value.toString()));
        },
      });

      const response = await request(httpServer(app))
        .get('/code-payment-service/subscriptions/payment-callback/vnpay')
        .query({
          vnp_TxnRef: txnRef,
          vnp_ResponseCode: '00',
          vnp_TransactionStatus: '00',
          vnp_TransactionNo: 'BANK-001',
          vnp_Amount: 9900000,
        })
        .expect(200);

      const body = response.body as { RspCode: string };
      expect(body.RspCode).toBe('00');

      const outbox = await dataSource.getRepository(OutboxEntity).findOne({
        where: {
          aggregateId: subscriptionId,
          eventType: 'SubscriptionPurchasedEvent',
        },
      });
      expect(outbox).not.toBeNull();
      expect(outbox!.status).toBe('PENDING');

      await outboxRelayCron.processOutboxMessages();

      const deadline = Date.now() + 10_000;
      while (receivedMessages.length === 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      await consumer.disconnect();

      expect(receivedMessages.length).toBeGreaterThanOrEqual(1);
      const msg = receivedMessages[0] as {
        userId: string;
        subscriptionId: string;
        planId: string;
        version: number;
        periodStart: string;
        periodEnd: string;
      };
      expect(msg.userId).toBe(userId);
      expect(msg.subscriptionId).toBe(subscriptionId);
      expect(msg.planId).toBe(planId);
      expect(msg.version).toBeGreaterThanOrEqual(1);
      expect(msg.periodStart).toBeDefined();
      expect(msg.periodEnd).toBeDefined();

      const updatedOutbox = await dataSource
        .getRepository(OutboxEntity)
        .findOne({
          where: {
            aggregateId: subscriptionId,
            eventType: 'SubscriptionPurchasedEvent',
          },
        });
      expect(updatedOutbox!.status).toBe('DONE');

      await dataSource
        .getRepository(TransactionEntity)
        .delete({ id: transactionId });
      await dataSource
        .getRepository(SubscriptionEntity)
        .delete({ id: subscriptionId });
      await dataSource.getRepository(PlanEntity).delete({ id: planId });
      await dataSource
        .getRepository(OutboxEntity)
        .delete({ aggregateId: subscriptionId });
    });
  });
});
