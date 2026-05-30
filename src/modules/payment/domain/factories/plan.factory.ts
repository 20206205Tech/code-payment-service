import { Money } from '../value-objects/money';
import { Plan } from '../entities/plan';
import { PlanDurationMonths } from '../value-objects/plan-duration-months';
import { PlanName } from '../value-objects/plan-name';

export class PlanFactory {
  static create(
    name: PlanName,
    durationMonths: PlanDurationMonths,
    price: Money,
    isActive: boolean = true,
  ): Plan {
    return Plan.create(name, durationMonths, price, isActive);
  }
}
