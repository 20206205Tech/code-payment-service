import { ArchivePlanController } from './http/controllers/archive-plan.controller';
import { CreatePlanController } from './http/controllers/create-plan.controller';
import { GetAllPlanController } from './http/controllers/get-all-plan.controller';
import { GetDetailPlanController } from './http/controllers/get-detail-plan.controller';
// import { UpdatePricePlanController } from './http/controllers/update-price-plan.controller';

import { GetMySubscriptionController } from './http/controllers/get-my-subscription.controller';
import { GetTransactionHistoryController } from './http/controllers/get-transaction-history.controller';
import { ManualActivateTransactionController } from './http/controllers/manual-activate-transaction.controller';
import { PaymentCallbackController } from './http/controllers/payment-callback.controller';
import { PaymentReturnController } from './http/controllers/payment-return.controller';
import { PurchaseSubscriptionController } from './http/controllers/purchase-subscription.controller';

const planControllers = [
  CreatePlanController,
  // UpdatePricePlanController,
  ArchivePlanController,
  GetAllPlanController,
  GetDetailPlanController,
];

const subscriptionControllers = [
  PurchaseSubscriptionController,
  PaymentCallbackController,
  PaymentReturnController,
  GetMySubscriptionController,
  GetTransactionHistoryController,
  ManualActivateTransactionController,
];

export const PaymentApi = {
  resolvers: [],
  controllers: [...planControllers, ...subscriptionControllers],
};
