import { SubscriptionStatus } from './subscription-status';

describe('SubscriptionStatus', () => {
  it('should have correct enum values', () => {
    expect(SubscriptionStatus.PENDING).toBe('pending');
    expect(SubscriptionStatus.ACTIVE).toBe('active');
    expect(SubscriptionStatus.EXPIRED).toBe('expired');
  });

  it('should be usable as a type', () => {
    const status: SubscriptionStatus = SubscriptionStatus.ACTIVE;
    expect(status).toBe('active');
  });
});
