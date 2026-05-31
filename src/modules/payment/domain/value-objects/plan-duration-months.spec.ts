import { InvalidPlanDurationMonthsException } from '../exceptions/invalid-plan-duration-months.exception';
import { PlanDurationMonths } from './plan-duration-months';

describe('PlanDurationMonths', () => {
  it('should store a valid positive integer', () => {
    const valueObject = new PlanDurationMonths(12);

    expect(valueObject.value).toBe(12);
  });

  it('should reject zero or negative values', () => {
    expect(() => new PlanDurationMonths(0)).toThrow(
      InvalidPlanDurationMonthsException,
    );
    expect(() => new PlanDurationMonths(-1)).toThrow(
      InvalidPlanDurationMonthsException,
    );
  });

  it('should reject non-integer values', () => {
    expect(() => new PlanDurationMonths(1.5)).toThrow(
      InvalidPlanDurationMonthsException,
    );
  });
});
