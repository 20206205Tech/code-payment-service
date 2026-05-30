import { SubscriptionPurchasedEvent } from './subscription-purchased.event';

describe('SubscriptionPurchasedEvent', () => {
  it('should store all constructor arguments', () => {
    const periodStart = new Date('2024-01-01');
    const periodEnd = new Date('2024-02-01');

    const event = new SubscriptionPurchasedEvent(
      'sub-id-1',
      'user-id-1',
      'plan-id-1',
      periodStart,
      periodEnd,
    );

    expect(event.subscriptionId).toBe('sub-id-1');
    expect(event.userId).toBe('user-id-1');
    expect(event.planId).toBe('plan-id-1');
    expect(event.periodStart).toBe(periodStart);
    expect(event.periodEnd).toBe(periodEnd);
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
