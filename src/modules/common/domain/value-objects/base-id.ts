import { DomainValueObject } from './domain-value-object';
import { randomUUID } from 'crypto';

export abstract class BaseId extends DomainValueObject<string> {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(value: string) {
    BaseId.validate(value);
    super(value);
  }

  get value(): string {
    return this._props;
  }

  // Hàm tiện ích cho các class con sinh UUID
  protected static generateUuid(): string {
    return randomUUID();
  }

  private static validate(value: string): void {
    if (!BaseId.UUID_REGEX.test(value)) {
      throw new Error(`Invalid ID format: "${value}". Must be a valid UUID.`);
    }
  }
}
