import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
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
        synchronize: false,
        logging: configService.getOrThrow<string>('NODE_ENV') === 'development',
        ssl:
          configService.getOrThrow<string>('NODE_ENV') === 'test'
            ? false
            : true,
        extra: {
          ssl:
            configService.getOrThrow<string>('NODE_ENV') === 'test'
              ? false
              : { rejectUnauthorized: false }, // Cho phép chứng chỉ tự ký (self-signed)
          max: 1, // Giới hạn tối đa 1 connection trong pool (Hữu ích khi chạy serverless để tránh cạn kiệt connection)
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
