import { BaseId } from '../../../common/domain/value-objects/base-id';

export class PlanId extends BaseId {
  public static create(): PlanId {
    return new PlanId(this.generateUuid());
  }
}
