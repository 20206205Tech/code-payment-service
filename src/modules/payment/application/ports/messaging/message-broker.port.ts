export const MESSAGE_BROKER_PORT = Symbol('MESSAGE_BROKER_PORT');

export interface SubscriptionPurchasedPayload {
  subscriptionId: string;
  userId: string;
  planId: string;
  periodStart: Date;
  periodEnd: Date;
  version: number;
}

export interface MessageBrokerPort {
  publishSubscriptionPurchased(
    payload: SubscriptionPurchasedPayload,
  ): Promise<void>;
}
