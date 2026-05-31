import { ArchivePlanController } from './http/controllers/plan/archive-plan.controller';
import { CreatePlanController } from './http/controllers/plan/create-plan.controller';
import { GetAllPlanController } from './http/controllers/plan/get-all-plan.controller';

import { PaymentCallbackController } from './http/controllers/payment/payment-callback.controller';
import { PaymentReturnController } from './http/controllers/payment/payment-return.controller';

import { GetMySubscriptionController } from './http/controllers/subscription/get-my-subscription.controller';
import { GetTransactionHistoryController } from './http/controllers/subscription/get-transaction-history.controller';
import { ManualActivateTransactionController } from './http/controllers/subscription/manual-activate-transaction.controller';
import { PurchaseSubscriptionController } from './http/controllers/subscription/purchase-subscription.controller';

const planControllers = [
  CreatePlanController,
  ArchivePlanController,
  GetAllPlanController,
];

const subscriptionControllers = [
  PurchaseSubscriptionController,
  GetMySubscriptionController,
  GetTransactionHistoryController,
  ManualActivateTransactionController,
];

const paymentControllers = [PaymentCallbackController, PaymentReturnController];

export const PaymentApi = {
  resolvers: [],
  controllers: [
    ...planControllers,
    ...subscriptionControllers,
    ...paymentControllers,
  ],
};
