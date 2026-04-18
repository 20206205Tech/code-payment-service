import { DomainException } from './domain.exception';

export class InvalidVersionException extends DomainException {
  constructor(value: number, min: number) {
    super(
      `Invalid version value: ${value}. Must be greater than or equal to ${min}.`,
    );
  }
}
