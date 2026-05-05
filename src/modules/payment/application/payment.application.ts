import { Type } from '@nestjs/common';
import {
  CqrsModule,
  ICommandHandler,
  IEventHandler,
  IQueryHandler,
} from '@nestjs/cqrs';

import { ArchivePlanCommandHandler } from './commands/archive-plan.command-handler';
import { CreatePlanCommandHandler } from './commands/create-plan.command-handler';

import { PurchaseSubscriptionCommandHandler } from './commands/purchase-subscription.command-handler';
import { ManualActivateTransactionCommandHandler } from './commands/manual-activate-transaction.command-handler';
import { PaymentCallbackCommandHandler } from './commands/payment-callback.command-handler';
import { PaymentReturnCommandHandler } from './commands/payment-return.command-handler';

import { GetAllPlanQueryHandler } from './queries/get-all-plan.query-handler';
import { GetDetailPlanQueryHandler } from './queries/get-detail-plan.query-handler';

import { GetMySubscriptionQueryHandler } from './queries/get-my-subscription.query-handler';
import { GetTransactionHistoryQueryHandler } from './queries/get-transaction-history.query-handler';

import { SubscriptionPurchasedEventHandler } from './event-handlers/subscription-purchased.event-handler';
import { PaymentTimeoutProcessor } from './processors/payment-timeout.processor';
import { PaymentDomainService } from '../domain/services/payment.domain-service';

const commandHandlers: Type<ICommandHandler>[] = [
  CreatePlanCommandHandler,
  ArchivePlanCommandHandler,
  PurchaseSubscriptionCommandHandler,
  PaymentCallbackCommandHandler,
  PaymentReturnCommandHandler,
  ManualActivateTransactionCommandHandler,
];

const eventHandlers: Type<IEventHandler>[] = [
  SubscriptionPurchasedEventHandler,
];

const queryHandlers: Type<IQueryHandler>[] = [
  GetAllPlanQueryHandler,
  GetDetailPlanQueryHandler,
  GetMySubscriptionQueryHandler,
  GetTransactionHistoryQueryHandler,
];

export const PaymentApplication = {
  imports: [CqrsModule],
  providers: [
    ...commandHandlers,
    ...eventHandlers,
    ...queryHandlers,
    PaymentTimeoutProcessor,
    PaymentDomainService,
  ],
};
