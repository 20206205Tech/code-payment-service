import { InvalidMoneyException } from '../exceptions/invalid-money.exception';

export class Money {
  private static readonly MIN_AMOUNT = 0;
  private readonly _amount: number;

  constructor(amount: number) {
    if (amount < Money.MIN_AMOUNT)
      throw new InvalidMoneyException(amount, Money.MIN_AMOUNT);
    this._amount = Math.round(amount);
  }

  get amount(): number {
    return this._amount;
  }

  add(other: Money): Money {
    return new Money(this._amount + other._amount);
  }

  subtract(other: Money): Money {
    return new Money(Math.max(0, this._amount - other._amount));
  }

  equals(other: Money): boolean {
    return this._amount === other._amount;
  }
}
