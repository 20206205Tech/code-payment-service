import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
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
          url: configService.get<string>('REDIS_URL'),
        },
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>(
          'MICROSERVICE_PAYMENT_SERVICE_DATABASE_URL',
        ),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl: configService.get<string>('NODE_ENV') === 'test' ? false : true,
        extra: {
          ssl:
            configService.get<string>('NODE_ENV') === 'test'
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
