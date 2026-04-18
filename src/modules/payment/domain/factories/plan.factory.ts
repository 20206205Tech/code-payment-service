import { Money } from '../value-objects/money';
import { Plan } from '../entities/plan';

export class PlanFactory {
  static create(
    name: string,
    durationMonths: number,
    price: number,
    isActive: boolean = true,
  ): Plan {
    return Plan.create(name, durationMonths, new Money(price), isActive);
  }
}
