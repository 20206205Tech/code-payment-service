import { AuthModule } from '@20206205tech/nestjs-auth';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { LoggerModule } from './modules/logger/logger.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.getOrThrow<string>('REDIS_URL'),
        },
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>(
          'MICROSERVICE_PAYMENT_SERVICE_DATABASE_URL',
        ),
        autoLoadEntities: true,
        synchronize: configService.get<string>('ENVIRONMENT') === 'test',
        logging:
          configService.getOrThrow<string>('ENVIRONMENT') === 'development',
        ssl:
          configService.getOrThrow<string>('ENVIRONMENT') === 'test'
            ? false
            : true,
        extra: {
          ssl:
            configService.getOrThrow<string>('ENVIRONMENT') === 'test'
              ? false
              : { rejectUnauthorized: false },
          max: 10,
          // Tăng thời gian chờ lên 15s để Neon có đủ thời gian "thức dậy" (cold start)
          connectionTimeoutMillis: 15000,
          // Bật keepAlive và đưa cấu hình ra cùng cấp với max, connectionTimeoutMillis
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
          idleTimeoutMillis: 30000,
        },
      }),
    }),

    AuthModule,
    LoggerModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
