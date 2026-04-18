import { SubscriptionPurchasedEvent } from './subscription-purchased.event';

describe('SubscriptionPurchasedEvent', () => {
  it('should be defined', () => {
    expect(new SubscriptionPurchasedEvent()).toBeDefined();
  });
});
