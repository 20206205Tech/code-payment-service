import { InvalidPlanNameException } from './invalid-plan-name.exception';

describe('InvalidPlanNameException', () => {
  it('should format the error message with the invalid value and bounds', () => {
    const exception = new InvalidPlanNameException('Pro-Plan', 2, 30);

    expect(exception.message).toBe(
      'Invalid plan name: "Pro-Plan". Must contain only alphanumeric characters and spaces (A-Z, a-z, 0-9, space) and length must be greater than 2 and less than 30.',
    );
  });
});
