import { InvalidPlanNameException } from '../exceptions/invalid-plan-name.exception';

export class PlanName {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 30;
  private static readonly ALLOWED_CHARACTERS_REGEX = /^[A-Za-z0-9 ]+$/;
  private readonly _value: string;

  constructor(value: string) {
    const trimmedValue = value.trim();

    if (
      trimmedValue.length <= PlanName.MIN_LENGTH ||
      trimmedValue.length >= PlanName.MAX_LENGTH
    ) {
      throw new InvalidPlanNameException(
        value,
        PlanName.MIN_LENGTH,
        PlanName.MAX_LENGTH,
      );
    }

    if (!PlanName.ALLOWED_CHARACTERS_REGEX.test(trimmedValue)) {
      throw new InvalidPlanNameException(
        value,
        PlanName.MIN_LENGTH,
        PlanName.MAX_LENGTH,
      );
    }

    this._value = trimmedValue;
  }

  get value(): string {
    return this._value;
  }

  equals(other: PlanName): boolean {
    return this._value === other._value;
  }
}
