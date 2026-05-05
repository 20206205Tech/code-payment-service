import { DomainException } from '@20206205tech/nestjs-common';

export class SubscriptionNotFoundException extends DomainException {
  constructor(subscriptionId?: string) {
    const message = subscriptionId
      ? `Subscription với ID "${subscriptionId}" không tồn tại.`
      : 'Không tìm thấy subscription yêu cầu.';
    super(message);
  }
}
