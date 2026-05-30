import { SubscriptionStatus } from '../../../domain/value-objects/subscription-status';
import { SubscriptionEntity } from './subscription.entity';

describe('SubscriptionEntity', () => {
  it('should be able to create a new instance', () => {
    const entity = new SubscriptionEntity();
    entity.id = 'sub-123';
    entity.userId = 'user-456';
    entity.status = SubscriptionStatus.ACTIVE;

    expect(entity.id).toBe('sub-123');
    expect(entity.status).toBe(SubscriptionStatus.ACTIVE);
  });
});
