import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLog } from './entities/request-log.entity';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([RequestLog])],
  providers: [
    {
      provide: APP_INTERCEPTOR, // Đăng ký làm Interceptor áp dụng cho toàn bộ dự án
      useClass: LoggingInterceptor,
    },
  ],
})
export class LoggerModule {}
