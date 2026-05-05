import { DomainException } from '@20206205tech/nestjs-common';
import { SubscriptionNotFoundException } from './subscription-not-found.exception';

describe('SubscriptionNotFoundException', () => {
  it('should create exception with subscriptionId in the message', () => {
    const ex = new SubscriptionNotFoundException('abc-123');
    expect(ex.message).toContain('abc-123');
  });

  it('should create a generic message when no subscriptionId given', () => {
    const ex = new SubscriptionNotFoundException();
    expect(ex.message).toContain('Không tìm thấy subscription yêu cầu.');
  });

  it('should be an instance of DomainException', () => {
    const ex = new SubscriptionNotFoundException();
    expect(ex).toBeInstanceOf(DomainException);
  });

  it('should be an instance of Error', () => {
    const ex = new SubscriptionNotFoundException();
    expect(ex).toBeInstanceOf(Error);
  });

  it('should have name "SubscriptionNotFoundException"', () => {
    const ex = new SubscriptionNotFoundException();
    expect(ex.name).toBe('SubscriptionNotFoundException');
  });
});
