import { DomainException } from '@20206205tech/nestjs-common';

export class InvalidMoneyException extends DomainException {
  constructor(value: number, min: number) {
    super(
      `Invalid money value: ${value}. Must be greater than or equal to ${min}.`,
    );
  }
}
