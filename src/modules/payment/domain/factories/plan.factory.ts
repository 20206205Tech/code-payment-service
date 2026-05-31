import { Plan } from '../entities/plan';
import { DEFAULT_PLAN_FEATURES } from '../value-objects/constants';
import { Money } from '../value-objects/money';
import { PlanDurationMonths } from '../value-objects/plan-duration-months';
import { PlanName } from '../value-objects/plan-name';

export class PlanFactory {
  static create(
    name: PlanName,
    durationMonths: PlanDurationMonths,
    price: Money,
    isActive: boolean = true,
    features: string[] = DEFAULT_PLAN_FEATURES,
  ): Plan {
    return Plan.create(name, durationMonths, price, isActive, features);
  }
}
