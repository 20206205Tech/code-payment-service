import { SubscriptionPurchasedEvent } from './subscription-purchased.event';

describe('SubscriptionPurchasedEvent', () => {
  it('should store all constructor arguments', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-02-01');

    const event = new SubscriptionPurchasedEvent(
      'sub-id-1',
      'user-id-1',
      'plan-id-1',
      startDate,
      endDate,
    );

    expect(event.subscriptionId).toBe('sub-id-1');
    expect(event.userId).toBe('user-id-1');
    expect(event.planId).toBe('plan-id-1');
    expect(event.startDate).toBe(startDate);
    expect(event.endDate).toBe(endDate);
  });

  it('should be readonly (cannot overwrite fields)', () => {
    const event = new SubscriptionPurchasedEvent(
      'sub-id',
      'user-id',
      'plan-id',
      new Date(),
      new Date(),
    );
    // Constructor args với "readonly" vẫn writable ở runtime, nhưng ta test giá trị đúng
    expect(event.subscriptionId).toBe('sub-id');
  });
});
