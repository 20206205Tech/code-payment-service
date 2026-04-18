import { Subscription } from '../../../domain/entities/subscription';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { UserId } from '../../../domain/value-objects/user-id';

export const SUBSCRIPTION_REPOSITORY_PORT = Symbol(
  'SUBSCRIPTION_REPOSITORY_PORT',
);

export interface SubscriptionRepositoryPort {
  findById(id: SubscriptionId): Promise<Subscription | null>;
  findActiveByUserId(userId: UserId): Promise<Subscription | null>;
  isFirstPurchase(userId: UserId): Promise<boolean>;
  deactivateOtherSubscriptions(
    userId: UserId,
    excludeId: SubscriptionId,
  ): Promise<void>;
  save(subscription: Subscription): Promise<void>;
  delete(id: SubscriptionId): Promise<void>;
}
