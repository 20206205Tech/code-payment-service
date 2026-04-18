import { InvalidVersionException } from '../exceptions/invalid-version.exception';
import { DomainValueObject } from './domain-value-object';

export class BaseVersion extends DomainValueObject<number> {
  static readonly MIN_VALUE = 1;

  constructor(value: number) {
    BaseVersion.validate(value);
    super(value);
  }

  get value(): number {
    return this._props;
  }

  private static validate(value: number) {
    if (value < BaseVersion.MIN_VALUE) {
      throw new InvalidVersionException(value, BaseVersion.MIN_VALUE);
    }
  }
}
