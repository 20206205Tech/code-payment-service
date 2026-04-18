import { BaseId } from '../../../common/domain/value-objects/base-id';

export class TransactionId extends BaseId {
  public static create(): TransactionId {
    return new TransactionId(this.generateUuid());
  }
}
