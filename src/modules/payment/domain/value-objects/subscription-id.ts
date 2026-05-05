import { BaseId } from '@20206205tech/nestjs-common';

export class SubscriptionId extends BaseId {
  public static create(): SubscriptionId {
    return new SubscriptionId(this.generateUuid());
  }
}
