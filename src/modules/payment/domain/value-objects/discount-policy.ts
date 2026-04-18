import { DomainException } from '../../../common/domain/exceptions/domain.exception';
import { Money } from './money';

export type DiscountType = 'percentage' | 'fixed';

export class DiscountPolicy {
  private readonly _type: DiscountType;
  private readonly _value: number;

  constructor(type: DiscountType, value: number) {
    if (!['percentage', 'fixed'].includes(type))
      throw new DomainException('Loại giảm giá không hợp lệ');
    if (value < 0) throw new DomainException('Giá trị giảm giá không được âm');
    if (type === 'percentage' && value > 100)
      throw new DomainException('Phần trăm giảm giá không vượt quá 100%');
    this._type = type;
    this._value = value;
  }

  calculate(basePrice: Money): Money {
    if (this._type === 'percentage') {
      return new Money(basePrice.amount * (this._value / 100));
    }
    return new Money(Math.min(this._value, basePrice.amount));
  }

  get type(): DiscountType {
    return this._type;
  }
  get value(): number {
    return this._value;
  }
}
