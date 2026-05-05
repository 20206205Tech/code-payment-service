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
