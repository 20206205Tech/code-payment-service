import { BaseId } from './base-id';

export class UserId extends BaseId {
  public static create(): UserId {
    return new UserId(this.generateUuid());
  }
}
