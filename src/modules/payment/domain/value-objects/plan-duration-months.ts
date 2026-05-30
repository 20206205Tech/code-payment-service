import { InvalidPlanDurationMonthsException } from '../exceptions/invalid-plan-duration-months.exception';

export class PlanDurationMonths {
  private static readonly MIN_VALUE = 1;
  private readonly _value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < PlanDurationMonths.MIN_VALUE) {
      throw new InvalidPlanDurationMonthsException(value);
    }

    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}
