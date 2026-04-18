import { BaseId } from '../../../common/domain/value-objects/base-id';

export class SubscriptionId extends BaseId {
  public static create(): SubscriptionId {
    return new SubscriptionId(this.generateUuid());
  }
}
