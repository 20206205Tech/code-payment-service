import { SUBSCRIPTION_REPOSITORY_PORT } from './subscription.repository.port';

describe('SubscriptionRepositoryPort', () => {
  it('SUBSCRIPTION_REPOSITORY_PORT token should be a Symbol', () => {
    expect(typeof SUBSCRIPTION_REPOSITORY_PORT).toBe('symbol');
    expect(SUBSCRIPTION_REPOSITORY_PORT.toString()).toContain(
      'SUBSCRIPTION_REPOSITORY_PORT',
    );
  });
});
