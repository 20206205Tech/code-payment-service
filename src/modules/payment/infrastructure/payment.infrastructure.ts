import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VnpayModule } from 'nestjs-vnpay';
import { CACHE_PORT } from '../application/ports/cache.port';
import { PLAN_REPOSITORY_PORT } from '../application/ports/database/plan.repository.port';
import { SUBSCRIPTION_REPOSITORY_PORT } from '../application/ports/database/subscription.repository.port';
import { TRANSACTION_REPOSITORY_PORT } from '../application/ports/database/transaction.repository.port';
import { EMAIL_SENDER_PORT } from '../application/ports/email/email-sender.port';
import { MESSAGE_BROKER_PORT } from '../application/ports/messaging/message-broker.port';
import { PAYMENT_GATEWAY_PORT } from '../application/ports/payment/payment-gateway.port';
import { USER_PROFILE_PORT } from '../application/ports/service/user-profile.port';
import { PAYMENT_QUEUE } from '../domain/value-objects/constants';
import { RedisCacheAdapter } from './cache/redis-cache.adapter';
import { OutboxArchiveCron } from './cron/outbox-archive.cron';
import { OutboxRelayCron } from './cron/outbox-relay.cron';
import { PlanCleanupCron } from './cron/plan-cleanup.cron';
import { SubscriptionExpirationCron } from './cron/subscription-expiration.cron';
import { TransactionCleanupCron } from './cron/transaction-cleanup.cron';
import { OutboxArchiveEntity } from './database/entities/outbox-archive.entity';
import { OutboxEntity } from './database/entities/outbox.entity';
import { PlanEntity } from './database/entities/plan.entity';
import { SubscriptionEntity } from './database/entities/subscription.entity';
import { TransactionEntity } from './database/entities/transaction.entity';
import { CachedPlanRepository } from './database/repositories/cached-plan.repository';
import { PlanOrmRepository } from './database/repositories/plan.orm-repository';
import { SubscriptionOrmRepository } from './database/repositories/subscription.orm-repository';
import { TransactionOrmRepository } from './database/repositories/transaction.orm-repository';
import { BrevoNotificationAdapter } from './email/brevo-notification.adapter';
import { KafkaMessageBrokerAdapter } from './messaging/kafka-message-broker.adapter';
import { TelegramAlertService } from './messaging/telegram-alert.service';
import { MomoGatewayService } from './payment/gateway/momo-gateway.service';
import { SepayGatewayService } from './payment/gateway/sepay-gateway.service';
import { VnpayGatewayService } from './payment/gateway/vnpay-gateway.service';
import { ZalopayGatewayService } from './payment/gateway/zalopay-gateway.service';
import { PaymentGatewaySelectorService } from './payment/payment-gateway-selector.service';
import { SupabaseUserProfileService } from './services/supabase-user-profile.service';

import { PlanSeeder } from './database/seeders/plan.seeder';

const cronProviders: Provider[] = [
  OutboxArchiveCron,
  PlanCleanupCron,
  OutboxRelayCron,
  SubscriptionExpirationCron,
  TransactionCleanupCron,
];

export const PaymentGatewayInfrastructure = {
  imports: [
    HttpModule,
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        tmnCode: configService.getOrThrow<string>('PAYMENT_VNPAY_TMN_CODE'),
        secureSecret: configService.getOrThrow<string>(
          'PAYMENT_VNPAY_HASH_SECRET_KEY',
        ),
        vnpayHost: configService.getOrThrow<string>(
          'PAYMENT_VNPAY_PAYMENT_URL',
        ),
        //  testMode: process.env.ENVIRONMENT === 'development',
        testMode: true, // Vì không có thông tin prod
      }),
    }),
  ],
  providers: [
    VnpayGatewayService,
    ZalopayGatewayService,
    MomoGatewayService,
    SepayGatewayService,
    PaymentGatewaySelectorService,
    {
      provide: PAYMENT_GATEWAY_PORT,
      useClass: PaymentGatewaySelectorService,
    },
  ] as Provider[],
};

export const PaymentInfrastructure = {
  imports: [
    BullModule.registerQueue({
      name: PAYMENT_QUEUE,
      // Thêm cấu hình tự động dọn dẹp job
      defaultJobOptions: {
        // Tự động xóa job sau khi thành công.
        removeOnComplete: {
          age: 3600, // Tự động xóa job thành công sau 1 giờ (3600 giây)
          count: 50, // Chỉ giữ lại tối đa 50 job thành công gần nhất
        },
        // Tự động xóa job lỗi để tránh rác bộ nhớ, giữ lại tối đa 100 job lỗi để debug.
        removeOnFail: {
          age: 24 * 3600, // Tự động xóa job thất bại sau 24 giờ
          count: 100, // Chỉ giữ lại tối đa 100 job lỗi để debug
        },
      },
    }),
    TypeOrmModule.forFeature([
      PlanEntity,
      SubscriptionEntity,
      TransactionEntity,
      OutboxEntity,
      OutboxArchiveEntity,
    ]),
    ...PaymentGatewayInfrastructure.imports,
  ],
  providers: [
    ...PaymentGatewayInfrastructure.providers,
    PlanOrmRepository,
    {
      provide: CACHE_PORT,
      useFactory: (configService: ConfigService) =>
        new RedisCacheAdapter(configService.getOrThrow<string>('REDIS_URL')),
      inject: [ConfigService],
    },
    { provide: PLAN_REPOSITORY_PORT, useClass: CachedPlanRepository },
    {
      provide: SUBSCRIPTION_REPOSITORY_PORT,
      useClass: SubscriptionOrmRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY_PORT,
      useClass: TransactionOrmRepository,
    },
    { provide: EMAIL_SENDER_PORT, useClass: BrevoNotificationAdapter },
    { provide: USER_PROFILE_PORT, useClass: SupabaseUserProfileService },
    { provide: MESSAGE_BROKER_PORT, useClass: KafkaMessageBrokerAdapter },
    TelegramAlertService,
    PlanSeeder,
    ...cronProviders,
  ] as Provider[],
};
