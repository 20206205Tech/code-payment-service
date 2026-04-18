import { DomainException } from '../../../common/domain/exceptions/domain.exception';

export class Money {
  private readonly _amount: number;

  constructor(amount: number) {
    if (amount < 0) throw new DomainException('Số tiền không được âm');
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

// import { DomainValueObject } from './domain-value-object';

// export interface MoneyProps {
//   amount: number;
//   currency: string; // VND, USD, etc.
// }

// export class Money extends DomainValueObject<MoneyProps> {
//   private constructor(props: MoneyProps) {
//     Money.validate(props);
//     super(props);
//   }

//   public static create(amount: number, currency: string = 'VND'): Money {
//     return new Money({ amount, currency });
//   }

//   get amount(): number {
//     return this._props.amount;
//   }

//   get currency(): string {
//     return this._props.currency;
//   }

//   // Business logic: Cộng tiền
//   public add(other: Money): Money {
//     if (this.currency !== other.currency) {
//       throw new Error('Cannot add money with different currencies');
//     }
//     return Money.create(this.amount + other.amount, this.currency);
//   }

//   // Business logic: Trừ tiền
//   public subtract(other: Money): Money {
//     if (this.currency !== other.currency) {
//       throw new Error('Cannot subtract money with different currencies');
//     }
//     const result = this.amount - other.amount;
//     if (result < 0) {
//       throw new Error('Subtraction resulted in negative amount');
//     }
//     return Money.create(result, this.currency);
//   }

//   // Business logic: Nhân với %
//   public multiplyByPercentage(percentage: number): Money {
//     if (percentage < 0 || percentage > 100) {
//       throw new Error('Percentage must be between 0 and 100');
//     }
//     return Money.create((this.amount * percentage) / 100, this.currency);
//   }

//   // So sánh
//   public isGreaterThan(other: Money): boolean {
//     if (this.currency !== other.currency) {
//       throw new Error('Cannot compare money with different currencies');
//     }
//     return this.amount > other.amount;
//   }

//   public isLessThan(other: Money): boolean {
//     if (this.currency !== other.currency) {
//       throw new Error('Cannot compare money with different currencies');
//     }
//     return this.amount < other.amount;
//   }

//   private static validate(props: MoneyProps): void {
//     if (props.amount < 0) {
//       throw new Error('Money amount cannot be negative');
//     }
//     if (!props.currency || props.currency.trim() === '') {
//       throw new Error('Currency must be provided');
//     }
//   }

//   toJSON() {
//     return {
//       amount: this.amount,
//       currency: this.currency,
//     };
//   }
// }
