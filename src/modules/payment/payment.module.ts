import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PaymentApi } from './api/payment.api';
import { PaymentApplication } from './application/payment.application';
import { PAYMENT_QUEUE } from './domain/value-objects/constants';
import { PaymentInfrastructure } from './infrastructure/payment.infrastructure';

@Module({
  imports: [
    ...PaymentApplication.imports,
    ...PaymentInfrastructure.imports,
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
  ],
  controllers: [...PaymentApi.controllers],
  providers: [
    ...PaymentApplication.providers,
    ...PaymentApi.resolvers,
    ...PaymentInfrastructure.providers,
  ],
  exports: [],
})
export class PaymentModule {}
