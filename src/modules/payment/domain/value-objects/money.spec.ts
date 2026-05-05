import { Money } from './money';
import { InvalidMoneyException } from '../exceptions/invalid-money.exception';

describe('Money', () => {
  it('should create a valid money instance', () => {
    const money = new Money(100);
    expect(money.amount).toBe(100);
  });

  it('should throw InvalidMoneyException when amount is negative', () => {
    expect(() => new Money(-1)).toThrow(InvalidMoneyException);
  });

  it('should round to nearest integer', () => {
    const money = new Money(100.5);
    expect(money.amount).toBe(101);
  });

  describe('add()', () => {
    it('should add another money instance correctly', () => {
      const m1 = new Money(100);
      const m2 = new Money(50);
      const result = m1.add(m2);
      expect(result.amount).toBe(150);
    });
  });

  describe('subtract()', () => {
    it('should subtract another money instance correctly', () => {
      const m1 = new Money(100);
      const m2 = new Money(40);
      const result = m1.subtract(m2);
      expect(result.amount).toBe(60);
    });

    it('should return 0 when subtracting more than current amount (clamped to 0)', () => {
      const m1 = new Money(100);
      const m2 = new Money(150);
      const result = m1.subtract(m2);
      expect(result.amount).toBe(0);
    });
  });
});
