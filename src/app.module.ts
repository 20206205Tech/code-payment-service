import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from '@20206205tech/nestjs-common';
import { PaymentModule } from './modules/payment/payment.module';
import { LoggerModule } from './modules/logger/logger.module';

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
              : { rejectUnauthorized: false }, // Cho phép chứng chỉ tự ký (self-signed)
          max: 10, // Tăng giới hạn connection để tránh timeout khi có nhiều tiến trình (API + Cron)
          connectionTimeoutMillis: 5000, // Timeout kết nối sau 5s
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
