import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PAYMENT_QUEUE } from './constants';
import { PaymentApi } from './api/payment.api';
import { PaymentApplication } from './application/payment.application';
import { PaymentInfrastructure } from './infrastructure/payment.infrastructure';

@Module({
  imports: [
    ...PaymentApplication.imports,
    ...PaymentInfrastructure.imports,
    BullModule.registerQueue({
      name: PAYMENT_QUEUE,
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
