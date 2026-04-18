import { HttpModule } from '@nestjs/axios';
import { Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VnpayModule } from 'nestjs-vnpay';
import { PLAN_REPOSITORY_PORT } from '../application/ports/database/plan.repository.port';
import { SUBSCRIPTION_REPOSITORY_PORT } from '../application/ports/database/subscription.repository.port';
import { TRANSACTION_REPOSITORY_PORT } from '../application/ports/database/transaction.repository.port';
import { PAYMENT_GATEWAY_PORT } from '../application/ports/payment/payment-gateway.port';
import { NOTIFICATION_PORT } from '../application/ports/service/notification.port';
import { MESSAGE_BROKER_PORT } from '../application/ports/service/message-broker.port';
import { USER_PROFILE_PORT } from '../application/ports/services/user-profile.port';
import { OutboxEntity } from './database/entities/outbox.entity';
import { PlanEntity } from './database/entities/plan.entity';
import { SubscriptionEntity } from './database/entities/subscription.entity';
import { TransactionEntity } from './database/entities/transaction.entity';
import { PlanOrmRepository } from './database/repositories/plan.orm-repository';
import { SubscriptionOrmRepository } from './database/repositories/subscription.orm-repository';
import { TransactionOrmRepository } from './database/repositories/transaction.orm-repository';
import { MomoGatewayService } from './payment/gateway/momo-gateway.service';
import { SepayGatewayService } from './payment/gateway/sepay-gateway.service';
import { VnpayGatewayService } from './payment/gateway/vnpay-gateway.service';
import { ZalopayGatewayService } from './payment/gateway/zalopay-gateway.service';
import { PaymentGatewaySelectorService } from './payment/payment-gateway-selector.service';
import { BrevoNotificationAdapter } from './email/brevo-notification.adapter';
import { SupabaseUserProfileService } from './services/supabase-user-profile.service';
import { KafkaMessageBrokerAdapter } from './messaging/kafka-message-broker.adapter';
import { PlanCleanupCron } from './cron/plan-cleanup.cron';
import { OutboxRelayCron } from './cron/outbox-relay.cron';

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
        testMode: process.env.NODE_ENV === 'development',
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
    // HttpModule,
    TypeOrmModule.forFeature([
      PlanEntity,
      SubscriptionEntity,
      TransactionEntity,
      OutboxEntity,
    ]),
    // VnpayModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     tmnCode: configService.getOrThrow<string>('PAYMENT_VNPAY_TMN_CODE'),
    //     secureSecret: configService.getOrThrow<string>(
    //       'PAYMENT_VNPAY_HASH_SECRET_KEY',
    //     ),
    //     vnpayHost: configService.getOrThrow<string>('PAYMENT_VNPAY_PAYMENT_URL'),
    //     testMode: process.env.NODE_ENV === 'development',
    //   }),
    // }),
    ...PaymentGatewayInfrastructure.imports,
  ],
  providers: [
    ...PaymentGatewayInfrastructure.providers,
    { provide: PLAN_REPOSITORY_PORT, useClass: PlanOrmRepository },
    {
      provide: SUBSCRIPTION_REPOSITORY_PORT,
      useClass: SubscriptionOrmRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY_PORT,
      useClass: TransactionOrmRepository,
    },
    // {
    //   provide: PAYMENT_GATEWAY_PORT,
    //   useClass: PaymentGatewaySelectorService,
    // },
    { provide: NOTIFICATION_PORT, useClass: BrevoNotificationAdapter },
    { provide: USER_PROFILE_PORT, useClass: SupabaseUserProfileService },
    { provide: MESSAGE_BROKER_PORT, useClass: KafkaMessageBrokerAdapter },
    PlanCleanupCron,
    OutboxRelayCron,
  ] as Provider[],
};
