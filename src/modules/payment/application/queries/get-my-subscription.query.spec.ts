import { GetMySubscriptionQuery } from './get-my-subscription.query';

describe('GetMySubscriptionQuery', () => {
  it('should store userId', () => {
    const q = new GetMySubscriptionQuery(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(q.userId).toBe('11111111-1111-1111-1111-111111111111');
  });
});
