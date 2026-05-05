import { BaseId } from '@20206205tech/nestjs-common';

export class TransactionId extends BaseId {
  public static create(): TransactionId {
    return new TransactionId(this.generateUuid());
  }
}
