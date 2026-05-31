import { InvalidPlanDurationMonthsException } from './invalid-plan-duration-months.exception';

describe('InvalidPlanDurationMonthsException', () => {
  it('should format the error message with the invalid value', () => {
    const exception = new InvalidPlanDurationMonthsException(0);

    expect(exception.message).toBe(
      'Invalid plan duration months: 0. Must be a positive integer greater than 0.',
    );
  });
});
// import { DomainException } from '@20206205tech/nestjs-common';
//
// export class InvalidPlanDurationMonthsException extends DomainException {
//   constructor(value: number) {
//     super(
//       `Invalid plan duration months: ${value}. Must be a positive integer greater than 0.`,
//     );
//   }
// }
