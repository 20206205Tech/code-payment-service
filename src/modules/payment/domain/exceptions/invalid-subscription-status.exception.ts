import { DomainException } from '@20206205tech/nestjs-common';

export class InvalidSubscriptionStatusException extends DomainException {
  constructor(status: string, action: string) {
    super(
      `Subscription với trạng thái "${status}" không thể thực hiện hành động "${action}".`,
    );
  }
}
