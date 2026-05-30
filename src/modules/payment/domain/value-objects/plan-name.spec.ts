import { InvalidPlanNameException } from '../exceptions/invalid-plan-name.exception';
import { PlanName } from './plan-name';

describe('PlanName', () => {
  it('should trim and store valid names with spaces', () => {
    const name = new PlanName('  Pro Plan  ');

    expect(name.value).toBe('Pro Plan');
  });

  it('should reject names containing unsupported symbols', () => {
    expect(() => new PlanName('Pro-Plan')).toThrow(InvalidPlanNameException);
  });

  it('should reject names that are too short or too long', () => {
    expect(() => new PlanName('Xx')).toThrow(InvalidPlanNameException);
    expect(() => new PlanName('A'.repeat(30))).toThrow(
      InvalidPlanNameException,
    );
  });

  it('should compare equal values', () => {
    expect(new PlanName('Basic Plan').equals(new PlanName('Basic Plan'))).toBe(
      true,
    );
  });
});
