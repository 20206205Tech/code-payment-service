import { InvalidSubscriptionStatusException } from './invalid-subscription-status.exception';

describe('InvalidSubscriptionStatusException', () => {
  it('should create with message including status and action', () => {
    const status = 'ACTIVE';
    const action = 'activate';
    const exception = new InvalidSubscriptionStatusException(status, action);
    expect(exception.message).toContain(status);
    expect(exception.message).toContain(action);
    expect(exception.message).toContain('không thể thực hiện hành động');
  });
});
