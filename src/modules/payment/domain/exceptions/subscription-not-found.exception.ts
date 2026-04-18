import { DomainException } from '../../../common/domain/exceptions/domain.exception';

export class SubscriptionNotFoundException extends DomainException {
  constructor(subscriptionId?: string) {
    const message = subscriptionId
      ? `Subscription với ID "${subscriptionId}" không tồn tại.`
      : 'Không tìm thấy subscription yêu cầu.';
    super(message);
  }
}
