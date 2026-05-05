import { BaseId } from '@20206205tech/nestjs-common';

export class PlanId extends BaseId {
  public static create(): PlanId {
    return new PlanId(this.generateUuid());
  }
}
