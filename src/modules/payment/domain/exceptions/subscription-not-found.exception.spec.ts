import { SubscriptionNotFoundException } from './subscription-not-found.exception';

describe('SubscriptionNotFoundException', () => {
  it('should be defined', () => {
    expect(new SubscriptionNotFoundException()).toBeDefined();
  });
});
