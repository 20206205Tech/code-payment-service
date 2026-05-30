import { UserId } from '@20206205tech/nestjs-common';
import { Subscription } from '../../../domain/entities/subscription';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';

export const SUBSCRIPTION_REPOSITORY_PORT = Symbol(
  'SUBSCRIPTION_REPOSITORY_PORT',
);

export interface SubscriptionRepositoryPort {
  findById(id: SubscriptionId): Promise<Subscription | null>;
  findByUserId(userId: UserId): Promise<Subscription | null>;
  findLatestActiveSubscription(userId: UserId): Promise<Subscription | null>;
  isFirstPurchase(userId: UserId): Promise<boolean>;
  deactivateOtherSubscriptions(
    userId: UserId,
    excludeId: SubscriptionId,
  ): Promise<void>;
  findActiveExpiringBefore(date: Date): Promise<Subscription[]>;
  findActiveExpiringBetween(start: Date, end: Date): Promise<Subscription[]>;
  save(subscription: Subscription, context?: any): Promise<void>;
  delete(id: SubscriptionId): Promise<void>;
}
